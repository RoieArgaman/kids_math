import { SECTION_QUESTION_COUNTS } from "./config";
import type { GmatSectionKey } from "./types";
import type { Exercise, ExerciseId } from "@/lib/types";
import { isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

export type GmatGradeResult = {
  scorePercent: number;
  scoreBySection: Record<GmatSectionKey, number>;
  correctBySection: Record<GmatSectionKey, number>;
  totalQuestions: number;
  correctCount: number;
};

export function gradeGmatChallenge(params: {
  itemsBySection: Record<GmatSectionKey, ExerciseId[]>;
  exerciseById: Map<ExerciseId, Exercise>;
  answers: Record<ExerciseId, string>;
}): GmatGradeResult {
  const correctBySection: Record<GmatSectionKey, number> = { quant: 0, verbal: 0, data: 0 };
  const keys: GmatSectionKey[] = ["quant", "verbal", "data"];
  let total = 0;
  let correct = 0;

  for (const key of keys) {
    const ids = params.itemsBySection[key];
    for (const id of ids) {
      total += 1;
      const ex = params.exerciseById.get(id);
      if (!ex) continue;
      const raw = params.answers[id] ?? "";
      if (normalizeAnswerValue(raw) === null) {
        continue;
      }
      if (isAnswerCorrect(ex, raw)) {
        correct += 1;
        correctBySection[key] += 1;
      }
    }
  }

  const scorePercent = total === 0 ? 0 : Math.round((correct / total) * 100);
  const scoreBySection: Record<GmatSectionKey, number> = { quant: 0, verbal: 0, data: 0 };
  for (const key of keys) {
    const n = SECTION_QUESTION_COUNTS[key];
    const c = correctBySection[key];
    scoreBySection[key] = n === 0 ? 0 : Math.round((c / n) * 100);
  }

  return { scorePercent, scoreBySection, correctBySection, totalQuestions: total, correctCount: correct };
}
