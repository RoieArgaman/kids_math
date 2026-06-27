import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";
import type { EnglishFinalExamState, EnglishFinalExamStateV1 } from "@/lib/english/final-exam/types";
import { scheduleSync } from "@/lib/auth/serverSync";

/**
 * Each English level has its own final-exam state, keyed by level. `level`
 * defaults to "a" so the legacy single key + all existing call sites (sync
 * bundle, admin) keep resolving to Level A's exam with no change.
 */
const LEGACY_ENGLISH_FINAL_EXAM_STORAGE_KEY = "kids_math.english.final_exam.v1";

/** Exposed for cross-tab listeners + sync. Defaults to Level A. */
export function englishFinalExamStorageKey(level: GradeId = "a"): string {
  return `${LEGACY_ENGLISH_FINAL_EXAM_STORAGE_KEY}.level.${level}`;
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

export function createInitialEnglishFinalExamState(params: {
  selectedExerciseIds: ExerciseId[];
}): EnglishFinalExamStateV1 {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    pickerVersion: 1,
    selectedExerciseIds: params.selectedExerciseIds.slice(),
    answers: {},
    correctMap: {},
  };
}

/**
 * One-time migration: the pre-level single key becomes Level A's key. Runs only
 * when Level A has no level-scoped value yet.
 */
function migrateLegacyExamToLevelA(): void {
  if (typeof window === "undefined") return;
  try {
    const levelAKey = englishFinalExamStorageKey("a");
    if (window.localStorage.getItem(levelAKey)) return;
    const legacy = window.localStorage.getItem(LEGACY_ENGLISH_FINAL_EXAM_STORAGE_KEY);
    if (!legacy) return;
    window.localStorage.setItem(levelAKey, legacy);
    window.localStorage.removeItem(LEGACY_ENGLISH_FINAL_EXAM_STORAGE_KEY);
  } catch {
    // private mode / quota — ignore
  }
}

export function loadEnglishFinalExamState(level: GradeId = "a"): EnglishFinalExamState | null {
  if (typeof window === "undefined") return null;
  if (level === "a") migrateLegacyExamToLevelA();
  const raw = window.localStorage.getItem(englishFinalExamStorageKey(level));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== 1) return null;
    if (parsed.pickerVersion !== 1) return null;
    const selected = Array.isArray(parsed.selectedExerciseIds)
      ? parsed.selectedExerciseIds.filter((id): id is ExerciseId => typeof id === "string")
      : [];
    // Tolerant of curriculum growth: accept any non-empty selection.
    if (selected.length === 0) return null;

    const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined;
    const scorePercent =
      typeof parsed.scorePercent === "number" && Number.isFinite(parsed.scorePercent)
        ? parsed.scorePercent
        : undefined;
    const passed = typeof parsed.passed === "boolean" ? parsed.passed : undefined;

    return {
      version: 1,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      pickerVersion: 1,
      selectedExerciseIds: selected,
      answers: sanitizeStringRecord(parsed.answers) as Record<ExerciseId, string>,
      correctMap: sanitizeBooleanRecord(parsed.correctMap) as Record<ExerciseId, boolean>,
      submittedAt,
      scorePercent,
      passed,
    };
  } catch {
    return null;
  }
}

export function saveEnglishFinalExamState(state: EnglishFinalExamState, level: GradeId = "a"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(englishFinalExamStorageKey(level), JSON.stringify(state));
    scheduleSync();
  } catch {
    // private mode / quota — ignore
  }
}

export function clearEnglishFinalExamState(level: GradeId = "a"): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(englishFinalExamStorageKey(level));
}
