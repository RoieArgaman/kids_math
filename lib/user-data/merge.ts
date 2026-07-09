import type {
  UserProgressBundle,
  GradeProgressData,
  EnglishProgressData,
  ScienceProgressData,
} from "@/lib/user-data/types";
import type { WorkbookProgressState, DayId, DayProgressState } from "@/lib/types";
import { mergeBestTimeMs } from "@/lib/progress/engine";

/** Skew (ms) beyond server `now` at which an incoming timestamp is treated as clock drift and clamped. */
export const FUTURE_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Parse an ISO timestamp for last-write-wins comparison. A missing or invalid
 * value is treated as the OLDEST possible instant (epoch 0), so any present,
 * valid timestamp beats it.
 */
function timeOf(updatedAt: string | null | undefined): number {
  if (typeof updatedAt !== "string") return 0;
  const parsed = Date.parse(updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Read a domain's `updatedAt` regardless of the concrete domain type. */
function updatedAtOf(value: { updatedAt?: string | null } | null | undefined): string | null | undefined {
  return value == null ? undefined : value.updatedAt;
}

/**
 * Whole-domain last-write-wins. Keeps the side whose `updatedAt` is newer;
 * a missing side loses to a present one; on an exact tie, `incoming` wins.
 */
function newer<T extends { updatedAt?: string | null } | null | undefined>(
  existing: T,
  incoming: T,
): T {
  if (existing == null) return incoming;
  if (incoming == null) return existing;
  // Tie prefers incoming: existing wins only if strictly newer.
  return timeOf(updatedAtOf(existing)) > timeOf(updatedAtOf(incoming)) ? existing : incoming;
}

/** Merge bestTimeMs across two day states (min of the two, or whichever is defined). */
function mergeDayBestTime(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return mergeBestTimeMs(a, b);
}

/** Merge two day states (both present): keep the newer, but reconcile bestTimeMs. */
function mergeDay(existing: DayProgressState, incoming: DayProgressState): DayProgressState {
  const kept = timeOf(existing.updatedAt) > timeOf(incoming.updatedAt) ? existing : incoming;
  const bestTimeMs = mergeDayBestTime(existing.bestTimeMs, incoming.bestTimeMs);
  return bestTimeMs === kept.bestTimeMs ? kept : { ...kept, bestTimeMs };
}

/**
 * Per-day merge of two workbooks. Union of dayIds; per-day newest wins; a day
 * on only one side is taken as-is. Top-level `updatedAt` is the max across both
 * workbook envelopes and all merged days. `version` stays 1.
 */
function mergeWorkbook(
  existing: WorkbookProgressState | null,
  incoming: WorkbookProgressState | null,
): WorkbookProgressState | null {
  if (existing == null) return incoming;
  if (incoming == null) return existing;

  const days: Record<DayId, DayProgressState> = {};
  const dayIds = Array.from(
    new Set<DayId>((Object.keys(existing.days) as DayId[]).concat(Object.keys(incoming.days) as DayId[])),
  );

  let maxTime = Math.max(timeOf(existing.updatedAt), timeOf(incoming.updatedAt));
  let maxTimeIso = timeOf(existing.updatedAt) >= timeOf(incoming.updatedAt)
    ? existing.updatedAt
    : incoming.updatedAt;

  for (const dayId of dayIds) {
    const a = existing.days[dayId];
    const b = incoming.days[dayId];
    const merged = a && b ? mergeDay(a, b) : (a ?? b);
    days[dayId] = merged;
    const t = timeOf(merged.updatedAt);
    if (t > maxTime && typeof merged.updatedAt === "string") {
      maxTime = t;
      maxTimeIso = merged.updatedAt;
    }
  }

  return { version: 1, days, updatedAt: maxTimeIso };
}

function mergeGrade(
  existing: GradeProgressData | null | undefined,
  incoming: GradeProgressData,
): GradeProgressData {
  if (existing == null) return incoming;
  return {
    workbook: mergeWorkbook(existing.workbook, incoming.workbook),
    badges: newer(existing.badges, incoming.badges),
    finalExam: newer(existing.finalExam, incoming.finalExam),
    gmat: newer(existing.gmat, incoming.gmat),
    review: newer(existing.review, incoming.review),
  };
}

function mergeSubject<T extends EnglishProgressData | ScienceProgressData>(
  existing: T | undefined,
  incoming: T | undefined,
): T | undefined {
  if (existing == null) return incoming;
  if (incoming == null) return existing;
  return {
    ...existing,
    workbook: mergeWorkbook(existing.workbook, incoming.workbook),
    finalExam: newer(existing.finalExam, incoming.finalExam),
    review: newer(existing.review, incoming.review),
  };
}

/**
 * Merge a stored bundle with an incoming one so cross-device pushes never clobber
 * each other. Pure and deterministic — no `new Date()`; the envelope `updatedAt`
 * is stamped by the caller (the route).
 *
 * - Whole-domain LWW for `streak` and each grade's `badges`/`finalExam`/`gmat`/`review`
 *   plus english/science `finalExam`/`review`.
 * - Per-day merge for every workbook domain.
 * - Missing data on one side is preserved from the other.
 * - `bundleVersion` is the max of both sides (forward-compatible).
 */
export function mergeBundles(
  existing: UserProgressBundle | null | undefined,
  incoming: UserProgressBundle,
): UserProgressBundle {
  if (existing == null) return incoming;

  // Defensive: the stored doc is untrusted Firestore data. A malformed/legacy doc
  // missing `grades` must not throw (which would 500 and block all pushes) — fall
  // back to `incoming` per-field so whatever the stored doc does have is preserved.
  const existingGrades = existing.grades ?? incoming.grades;
  const bundleVersion = (Math.max(existing.bundleVersion ?? 0, incoming.bundleVersion) as
    UserProgressBundle["bundleVersion"]);

  return {
    bundleVersion,
    updatedAt:
      timeOf(existing.updatedAt) >= timeOf(incoming.updatedAt)
        ? existing.updatedAt
        : incoming.updatedAt,
    streak: newer(existing.streak, incoming.streak),
    grades: {
      a: mergeGrade(existingGrades.a, incoming.grades.a),
      b: mergeGrade(existingGrades.b, incoming.grades.b),
    },
    english: mergeSubject(existing.english, incoming.english),
    science: mergeSubject(existing.science, incoming.science),
  };
}

/** Clamp an ISO timestamp to `nowIso` if it is more than the skew tolerance ahead of `nowMs`. */
function clampIso(updatedAt: string | undefined, nowMs: number, nowIso: string): string | undefined {
  if (typeof updatedAt !== "string") return updatedAt;
  const parsed = Date.parse(updatedAt);
  if (Number.isNaN(parsed)) return updatedAt;
  return parsed > nowMs + FUTURE_SKEW_TOLERANCE_MS ? nowIso : updatedAt;
}

function clampWorkbook(
  workbook: WorkbookProgressState | null,
  nowMs: number,
  nowIso: string,
): WorkbookProgressState | null {
  if (workbook == null) return workbook;
  const days: Record<DayId, DayProgressState> = {};
  for (const dayId of Object.keys(workbook.days) as DayId[]) {
    const day = workbook.days[dayId];
    days[dayId] = { ...day, updatedAt: clampIso(day.updatedAt, nowMs, nowIso) };
  }
  return { ...workbook, days, updatedAt: clampIso(workbook.updatedAt, nowMs, nowIso) ?? workbook.updatedAt };
}

function clampDomain<T extends { updatedAt?: string | null } | null>(
  domain: T,
  nowMs: number,
  nowIso: string,
): T {
  if (domain == null) return domain;
  if (typeof domain.updatedAt !== "string") return domain;
  return { ...domain, updatedAt: clampIso(domain.updatedAt, nowMs, nowIso) };
}

function clampGrade(grade: GradeProgressData, nowMs: number, nowIso: string): GradeProgressData {
  return {
    workbook: clampWorkbook(grade.workbook, nowMs, nowIso),
    badges: clampDomain(grade.badges, nowMs, nowIso),
    finalExam: clampDomain(grade.finalExam, nowMs, nowIso),
    gmat: clampDomain(grade.gmat, nowMs, nowIso),
    review: clampDomain(grade.review, nowMs, nowIso),
  };
}

function clampSubject<T extends EnglishProgressData | ScienceProgressData>(
  subject: T | undefined,
  nowMs: number,
  nowIso: string,
): T | undefined {
  if (subject == null) return subject;
  return {
    ...subject,
    workbook: clampWorkbook(subject.workbook, nowMs, nowIso),
    finalExam: clampDomain(subject.finalExam, nowMs, nowIso),
    review: clampDomain(subject.review, nowMs, nowIso),
  };
}

/**
 * Sanitize an incoming bundle's timestamps that are implausibly far in the future
 * (more than {@link FUTURE_SKEW_TOLERANCE_MS} ahead of `now`) by clamping them to
 * `now`. Guards LWW/per-day merges against a device with a fast clock.
 */
export function clampFutureTimestamps(bundle: UserProgressBundle, now: Date): UserProgressBundle {
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  return {
    ...bundle,
    updatedAt: clampIso(bundle.updatedAt, nowMs, nowIso) ?? bundle.updatedAt,
    streak: clampDomain(bundle.streak, nowMs, nowIso),
    grades: {
      a: clampGrade(bundle.grades.a, nowMs, nowIso),
      b: clampGrade(bundle.grades.b, nowMs, nowIso),
    },
    english: clampSubject(bundle.english, nowMs, nowIso),
    science: clampSubject(bundle.science, nowMs, nowIso),
  };
}
