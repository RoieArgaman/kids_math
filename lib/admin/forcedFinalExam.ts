import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { pickFinalExamExerciseIds } from "@/lib/final-exam/picker";
import { createInitialFinalExamState } from "@/lib/final-exam/storage";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GradeId } from "@/lib/grades";
import type { ExerciseId } from "@/lib/types";

/**
 * Deterministic payload for admin "mark final exam complete" (100%, passed).
 * Does not persist — caller runs `saveFinalExamState`.
 */
export function buildAdminForcedPassedFinalExamState(params: {
  grade: GradeId;
  seed: string;
  submittedAtIso?: string;
}): FinalExamState {
  const selectedExerciseIds = pickFinalExamExerciseIds({
    seed: params.seed,
    pickerVersion: 1,
    count: FINAL_EXAM_QUESTION_COUNT,
    grade: params.grade,
  });
  const base = createInitialFinalExamState({ grade: params.grade, selectedExerciseIds });
  const submittedAt = params.submittedAtIso ?? new Date().toISOString();
  const correctMap = selectedExerciseIds.reduce(
    (acc, id) => ({ ...acc, [id]: true }),
    {} as Record<ExerciseId, boolean>,
  );
  return {
    ...base,
    submittedAt,
    scorePercent: 100,
    passed: true,
    correctMap,
  };
}
