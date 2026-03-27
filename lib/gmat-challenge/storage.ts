import type { ExamPhase } from "@/lib/exam-session/types";
import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";
import { SECTION_QUESTION_COUNTS } from "./config";
import type { GmatChallengeStateV1, GmatSectionKey } from "./types";
import { GMAT_SECTION_ORDER_DEFAULT } from "./types";

const KEY_PREFIX = "kids_math.gmat_challenge.v1.grade.";

function keyForGrade(grade: GradeId): string {
  return `${KEY_PREFIX}${grade}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function sanitizeBooleanRecord(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

function sanitizeNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[k] = v;
  }
  return out;
}

const PHASES: ReadonlySet<ExamPhase> = new Set<ExamPhase>([
  "rules",
  "pickOrder",
  "sectionActive",
  "sectionReview",
  "break",
  "results",
]);

const SECTION_KEYS: ReadonlySet<string> = new Set(["quant", "verbal", "data"]);

function sanitizeSectionIds(value: unknown): ExerciseId[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is ExerciseId => typeof id === "string");
}

function sanitizeItemsBySection(
  value: unknown,
  phase: ExamPhase,
): Record<GmatSectionKey, ExerciseId[]> | null {
  if (!isRecord(value)) return null;
  const out: Record<GmatSectionKey, ExerciseId[]> = { quant: [], verbal: [], data: [] };
  for (const k of ["quant", "verbal", "data"] as const) {
    if (!(k in value)) return null;
    out[k] = sanitizeSectionIds(value[k]);
  }
  if (phase === "rules") {
    return out;
  }
  const keys: GmatSectionKey[] = ["quant", "verbal", "data"];
  for (const k of keys) {
    if (out[k].length !== SECTION_QUESTION_COUNTS[k]) {
      return null;
    }
  }
  return out;
}

function sanitizeBookmarks(value: unknown): Record<GmatSectionKey, ExerciseId[]> {
  if (!isRecord(value)) {
    return { quant: [], verbal: [], data: [] };
  }
  const out: Record<GmatSectionKey, ExerciseId[]> = { quant: [], verbal: [], data: [] };
  for (const k of ["quant", "verbal", "data"] as const) {
    out[k] = sanitizeSectionIds(value[k]);
  }
  return out;
}

function sanitizeSectionOrder(value: unknown): GmatSectionKey[] | null {
  if (!Array.isArray(value)) return null;
  const arr = value.filter((x): x is GmatSectionKey => typeof x === "string" && SECTION_KEYS.has(x));
  if (arr.length !== 3) return null;
  const uniq = new Set(arr);
  if (uniq.size !== 3) return null;
  return arr;
}

function sanitizeCorrectBySection(
  value: unknown,
): Record<GmatSectionKey, number> | undefined {
  if (!isRecord(value)) return undefined;
  const out: Record<GmatSectionKey, number> = { quant: 0, verbal: 0, data: 0 };
  for (const k of ["quant", "verbal", "data"] as const) {
    const v = value[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      return undefined;
    }
    out[k] = v;
  }
  return out;
}

export function createInitialRulesState(grade: GradeId): GmatChallengeStateV1 {
  return {
    version: 1,
    grade,
    createdAt: new Date().toISOString(),
    pickerVersion: 1,
    phase: "rules",
    sectionOrder: [...GMAT_SECTION_ORDER_DEFAULT],
    orderIndex: 0,
    itemsBySection: { quant: [], verbal: [], data: [] },
    answers: {},
    correctMap: {},
    attempts: {},
    bookmarks: { quant: [], verbal: [], data: [] },
    reviewSnapshot: null,
    sectionEndsAt: null,
    breakEndsAt: null,
  };
}

export function createStateAfterPick(params: {
  grade: GradeId;
  itemsBySection: Record<GmatSectionKey, ExerciseId[]>;
}): GmatChallengeStateV1 {
  const base = createInitialRulesState(params.grade);
  return {
    ...base,
    phase: "pickOrder",
    itemsBySection: params.itemsBySection,
  };
}

export function loadGmatChallengeState(grade: GradeId): GmatChallengeStateV1 | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(keyForGrade(grade));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== 1) return null;
    if (parsed.grade !== grade) return null;
    if (parsed.pickerVersion !== 1) return null;
    if (typeof parsed.phase !== "string" || !PHASES.has(parsed.phase as ExamPhase)) {
      return null;
    }

    const phase = parsed.phase as ExamPhase;
    const sectionOrder = sanitizeSectionOrder(parsed.sectionOrder);
    if (!sectionOrder) return null;

    const itemsBySection = sanitizeItemsBySection(parsed.itemsBySection, phase);
    if (!itemsBySection) return null;

    const orderIndex =
      typeof parsed.orderIndex === "number" &&
      Number.isFinite(parsed.orderIndex) &&
      parsed.orderIndex >= 0 &&
      parsed.orderIndex <= 2
        ? parsed.orderIndex
        : 0;

    let reviewSnapshot: Record<ExerciseId, string> | null = null;
    if (parsed.reviewSnapshot != null) {
      if (!isRecord(parsed.reviewSnapshot)) return null;
      reviewSnapshot = sanitizeStringRecord(parsed.reviewSnapshot) as Record<ExerciseId, string>;
    }


    const scoreBySectionClean = (() => {
      if (!isRecord(parsed.scoreBySection)) return undefined;
      const out: Record<GmatSectionKey, number> = { quant: 0, verbal: 0, data: 0 };
      for (const k of ["quant", "verbal", "data"] as const) {
        const v = parsed.scoreBySection[k];
        if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
        out[k] = v;
      }
      return out;
    })();

    const correctBySection = sanitizeCorrectBySection(parsed.correctBySection);

    return {
      version: 1,
      grade,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      pickerVersion: 1,
      phase,
      sectionOrder,
      orderIndex,
      itemsBySection,
      answers: sanitizeStringRecord(parsed.answers) as Record<ExerciseId, string>,
      correctMap: sanitizeBooleanRecord(parsed.correctMap) as Record<ExerciseId, boolean>,
      attempts: sanitizeNumberRecord(parsed.attempts) as Record<ExerciseId, number>,
      bookmarks: sanitizeBookmarks(parsed.bookmarks),
      reviewSnapshot,
      sectionEndsAt:
        typeof parsed.sectionEndsAt === "number" && Number.isFinite(parsed.sectionEndsAt)
          ? parsed.sectionEndsAt
          : null,
      breakEndsAt:
        typeof parsed.breakEndsAt === "number" && Number.isFinite(parsed.breakEndsAt)
          ? parsed.breakEndsAt
          : null,
      scorePercent:
        typeof parsed.scorePercent === "number" && Number.isFinite(parsed.scorePercent)
          ? parsed.scorePercent
          : undefined,
      scoreBySection: scoreBySectionClean,
      correctBySection,
      totalQuestions:
        typeof parsed.totalQuestions === "number" && Number.isFinite(parsed.totalQuestions)
          ? parsed.totalQuestions
          : undefined,
    };
  } catch {
    return null;
  }
}

export function saveGmatChallengeState(grade: GradeId, state: GmatChallengeStateV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyForGrade(grade), JSON.stringify(state));
  } catch {
    // private mode / quota
  }
}

export function clearGmatChallengeState(grade: GradeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyForGrade(grade));
  } catch {
    // ignore
  }
}
