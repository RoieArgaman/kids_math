import { getScienceDays, type ScienceLevel } from "@/lib/content/science-workbook";
import type { Exercise, ExerciseId } from "@/lib/types";
import { SCIENCE_FINAL_EXAM_TARGET_COUNT } from "@/lib/science/final-exam/config";
import { hashStringToUint32, mulberry32 } from "@/lib/utils/seededRandom";

export type PickerVersion = 1;

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** All exercises for one Science level (that level's final exam draws from these). */
export function buildScienceExamBank(level: ScienceLevel): Exercise[] {
  return getScienceDays(level).flatMap((d) => d.sections.flatMap((s) => s.exercises));
}

/**
 * Deterministically pick exam questions for a seed, scoped to one level. Caps at the
 * available bank size, so each level's exam scales with its own curriculum.
 */
export function pickScienceExamExerciseIds(params: {
  level: ScienceLevel;
  seed: string;
  pickerVersion: PickerVersion;
  count?: number;
}): ExerciseId[] {
  const bank = buildScienceExamBank(params.level);
  const target = Math.min(params.count ?? SCIENCE_FINAL_EXAM_TARGET_COUNT, bank.length);
  const rnd = mulberry32(hashStringToUint32(`${params.pickerVersion}:${params.seed}`));
  return shuffle(bank, rnd)
    .slice(0, target)
    .map((ex) => ex.id);
}
