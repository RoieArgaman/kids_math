import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";
import type { ScienceFinalExamState, ScienceFinalExamStateV1 } from "@/lib/science/final-exam/types";
import { scheduleSync } from "@/lib/auth/serverSync";

/**
 * Each Science level has its own final-exam state, keyed by level. Science is a
 * brand-new subject (no legacy single-key data to migrate), so the key is
 * level-scoped from the start. `level` defaults to "a" so call sites that only
 * care about Level א׳ (sync bundle, admin) stay terse.
 */
const SCIENCE_FINAL_EXAM_STORAGE_KEY_BASE = "kids_math.science.final_exam.v1";

/** Exposed for cross-tab listeners + sync. Defaults to Level א׳. */
export function scienceFinalExamStorageKey(level: GradeId = "a"): string {
  return `${SCIENCE_FINAL_EXAM_STORAGE_KEY_BASE}.level.${level}`;
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

export function createInitialScienceFinalExamState(params: {
  selectedExerciseIds: ExerciseId[];
}): ScienceFinalExamStateV1 {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    pickerVersion: 1,
    selectedExerciseIds: params.selectedExerciseIds.slice(),
    answers: {},
    correctMap: {},
  };
}

export function loadScienceFinalExamState(level: GradeId = "a"): ScienceFinalExamState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(scienceFinalExamStorageKey(level));
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

export function saveScienceFinalExamState(state: ScienceFinalExamState, level: GradeId = "a"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scienceFinalExamStorageKey(level), JSON.stringify(state));
    scheduleSync();
  } catch {
    // private mode / quota — ignore
  }
}

export function clearScienceFinalExamState(level: GradeId = "a"): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(scienceFinalExamStorageKey(level));
}
