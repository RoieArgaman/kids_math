import { ENGLISH_FINAL_EXAM_PASS_PERCENT } from "@/lib/english/final-exam/config";
import type { Exercise, ExerciseId } from "@/lib/types";
import { isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";
import { gradeExam } from "@/lib/exam/gradeExam";

export type EnglishFinalExamGradingResult = {
  total: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  passed: boolean;
  correctMap: Record<ExerciseId, boolean>;
  canFinish: boolean;
};

export function gradeEnglishFinalExam(params: {
  selectedExercises: Exercise[];
  answers: Record<ExerciseId, string>;
}): EnglishFinalExamGradingResult {
  const total = params.selectedExercises.length;
  const ids = params.selectedExercises.map((e) => e.id);

  const answeredCount = ids.filter((id) => normalizeAnswerValue(params.answers[id]) !== null).length;
  const canFinish = total > 0 && answeredCount === total;

  const correctMap: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  for (const ex of params.selectedExercises) {
    correctMap[ex.id] = isAnswerCorrect(ex, params.answers[ex.id] ?? "");
  }

  const correctCount = ids.filter((id) => Boolean(correctMap[id])).length;
  const { scorePercent, passed } = gradeExam({
    correctCount,
    total,
    passPercent: ENGLISH_FINAL_EXAM_PASS_PERCENT,
  });

  return { total, answeredCount, canFinish, correctMap, correctCount, scorePercent, passed };
}
