import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { FinalExamState, FinalExamStateV1 } from "@/lib/final-exam/types";
import { scheduleSync } from "@/lib/auth/serverSync";
import {
  sanitizeBooleanRecord,
  sanitizeNumberRecord,
  sanitizeStringRecord,
} from "@/lib/utils/sanitize";

const KEY_PREFIX = "kids_math.final_exam.v1.grade.";

function keyForGrade(grade: GradeId): string {
  return `${KEY_PREFIX}${grade}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    const updatedAt = typeof parsed.updatedAt === "string" ? parsed.updatedAt : undefined;

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
      updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveFinalExamState(grade: GradeId, state: FinalExamState): void {
  if (typeof window === "undefined") return;
  try {
    const nextState: FinalExamState = { ...state, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(keyForGrade(grade), JSON.stringify(nextState));
    scheduleSync();
  } catch {
    // Avoid crashes in private mode/quota errors.
  }
}

export function clearFinalExamState(grade: GradeId): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyForGrade(grade));
}

