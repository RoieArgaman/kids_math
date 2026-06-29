import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import type { ExerciseId } from "@/lib/types";
import { scheduleSync } from "@/lib/auth/serverSync";
import { isBrowser, isObject } from "@/lib/utils/guards";
import {
  REVIEW_STORAGE_SCHEMA_VERSION,
  type ReviewBox,
  type ReviewItemState,
  type ReviewState,
} from "./types";

/** Cross-tab/sync key for a math grade's review state. */
export function reviewStorageKey(grade: GradeId): string {
  return `kids_math.review.v1.grade.${grade}`;
}

/** Cross-tab/sync key for the English track's review state (single Pre-A1 track). */
export function englishReviewStorageKey(): string {
  return "kids_math.english.review.v1";
}

/** Cross-tab/sync key for the Science track's review state (single store, both levels). */
export function scienceReviewStorageKey(): string {
  return "kids_math.science.review.v1";
}

export type ReviewTrackOptions = { subject?: Subject; grade?: GradeId };

function keyFor(opts: ReviewTrackOptions): string {
  switch (opts.subject) {
    case "english":
      return englishReviewStorageKey();
    case "science":
      return scienceReviewStorageKey();
    default:
      return reviewStorageKey(opts.grade ?? DEFAULT_GRADE);
  }
}

function isReviewBox(value: unknown): value is ReviewBox {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function createInitialReviewState(now: string = new Date().toISOString()): ReviewState {
  return { version: REVIEW_STORAGE_SCHEMA_VERSION, items: {}, updatedAt: now };
}

function sanitizeItem(value: unknown): ReviewItemState | null {
  if (!isObject(value)) return null;
  const { exerciseId, box, dueAt, lastReviewedAt, timesSeen, timesCorrect } = value;
  if (typeof exerciseId !== "string") return null;
  if (!isReviewBox(box)) return null;
  if (typeof dueAt !== "string" || typeof lastReviewedAt !== "string") return null;
  return {
    exerciseId: exerciseId as ExerciseId,
    box,
    dueAt,
    lastReviewedAt,
    timesSeen: typeof timesSeen === "number" ? timesSeen : 0,
    timesCorrect: typeof timesCorrect === "number" ? timesCorrect : 0,
  };
}

export function sanitizeReviewState(value: unknown): ReviewState {
  const fallback = createInitialReviewState();
  if (!isObject(value)) return fallback;
  if (value.version !== REVIEW_STORAGE_SCHEMA_VERSION) return fallback;
  if (!isObject(value.items)) return fallback;

  const items: Record<ExerciseId, ReviewItemState> = {};
  for (const [id, raw] of Object.entries(value.items)) {
    const item = sanitizeItem(raw);
    if (item && item.exerciseId === id) {
      items[id as ExerciseId] = item;
    }
  }

  return {
    version: REVIEW_STORAGE_SCHEMA_VERSION,
    items,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function loadReviewState(opts: ReviewTrackOptions = {}): ReviewState {
  if (!isBrowser()) return createInitialReviewState();
  try {
    const raw = window.localStorage.getItem(keyFor(opts));
    if (!raw) return createInitialReviewState();
    return sanitizeReviewState(JSON.parse(raw) as unknown);
  } catch {
    return createInitialReviewState();
  }
}

export function saveReviewState(state: ReviewState, opts: ReviewTrackOptions = {}): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(keyFor(opts), JSON.stringify(state));
    scheduleSync();
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      try {
        window.dispatchEvent(
          new CustomEvent("kids_math:storage_quota_exceeded", { detail: { domain: "review" } }),
        );
      } catch {
        // dispatch failed — ignore
      }
    }
  }
}

export function clearReviewState(opts: ReviewTrackOptions = {}): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(keyFor(opts));
  } catch {
    // Intentionally no-op.
  }
}
