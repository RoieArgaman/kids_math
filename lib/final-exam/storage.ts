import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { FinalExamState, FinalExamStateV1 } from "@/lib/final-exam/types";

const KEY_PREFIX = "kids_math.final_exam.v1.grade.";

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

export function createInitialFinalExamState(params: {
  grade: GradeId;
  selectedExerciseIds: ExerciseId[];
}): FinalExamStateV1 {
  return {
    version: 1,
    grade: params.grade,
    createdAt: new Date().toISOString(),
    pickerVersion: 1,
    selectedExerciseIds: params.selectedExerciseIds.slice(0, FINAL_EXAM_QUESTION_COUNT),
    answers: {},
    correctMap: {},
    attempts: {},
  };
}

export function loadFinalExamState(grade: GradeId): FinalExamState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(keyForGrade(grade));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (parsed.version !== 1) return null;
    if (parsed.grade !== grade) return null;
    if (parsed.pickerVersion !== 1) return null;
    const selected = Array.isArray(parsed.selectedExerciseIds)
      ? parsed.selectedExerciseIds.filter((id): id is ExerciseId => typeof id === "string")
      : [];
    if (selected.length !== FINAL_EXAM_QUESTION_COUNT) return null;

    const submittedAt = typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined;
    const scorePercent =
      typeof parsed.scorePercent === "number" && Number.isFinite(parsed.scorePercent) ? parsed.scorePercent : undefined;
    const passed = typeof parsed.passed === "boolean" ? parsed.passed : undefined;

    return {
      version: 1,
      grade,
      createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : new Date().toISOString(),
      pickerVersion: 1,
      selectedExerciseIds: selected,
      answers: sanitizeStringRecord(parsed.answers) as Record<ExerciseId, string>,
      correctMap: sanitizeBooleanRecord(parsed.correctMap) as Record<ExerciseId, boolean>,
      attempts: sanitizeNumberRecord(parsed.attempts) as Record<ExerciseId, number>,
      submittedAt,
      scorePercent,
      passed,
    };
  } catch {
    return null;
  }
}

export function saveFinalExamState(grade: GradeId, state: FinalExamState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyForGrade(grade), JSON.stringify(state));
  } catch {
    // Avoid crashes in private mode/quota errors.
  }
}

export function clearFinalExamState(grade: GradeId): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyForGrade(grade));
}

