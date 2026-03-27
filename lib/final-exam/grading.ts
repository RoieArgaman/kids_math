import { FINAL_EXAM_PASS_PERCENT, FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { Exercise, ExerciseId } from "@/lib/types";
import { isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

export type FinalExamGradingResult = {
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  passed: boolean;
  correctMap: Record<ExerciseId, boolean>;
  canFinish: boolean;
};

export function gradeFinalExam(params: {
  selectedExercises: Exercise[];
  answers: Record<ExerciseId, string>;
}): FinalExamGradingResult {
  const ids = params.selectedExercises.map((e) => e.id);

  const answeredCount = ids.filter((id) => normalizeAnswerValue(params.answers[id]) !== null).length;
  const canFinish = answeredCount === FINAL_EXAM_QUESTION_COUNT;

  const correctMap: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  for (const ex of params.selectedExercises) {
    const raw = params.answers[ex.id] ?? "";
    correctMap[ex.id] = isAnswerCorrect(ex, raw);
  }

  const correctCount = ids.filter((id) => Boolean(correctMap[id])).length;
  const scorePercent = Math.round((correctCount / FINAL_EXAM_QUESTION_COUNT) * 100);
  const passed = scorePercent >= FINAL_EXAM_PASS_PERCENT;

  return { answeredCount, canFinish, correctMap, correctCount, scorePercent, passed };
}

