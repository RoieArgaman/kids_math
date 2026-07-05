import { getEnglishDays, type EnglishLevel } from "@/lib/content/english-workbook";
import type { Exercise, ExerciseId } from "@/lib/types";
import { ENGLISH_FINAL_EXAM_TARGET_COUNT } from "@/lib/english/final-exam/config";
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

/** All exercises for one English level (that level's final exam draws from these). */
export function buildEnglishExamBank(level: EnglishLevel): Exercise[] {
  return getEnglishDays(level).flatMap((d) => d.sections.flatMap((s) => s.exercises));
}

/**
 * Deterministically pick exam questions for a seed, scoped to one level. Caps at the
 * available bank size, so each level's exam scales with its own curriculum.
 */
export function pickEnglishExamExerciseIds(params: {
  level: EnglishLevel;
  seed: string;
  pickerVersion: PickerVersion;
  count?: number;
}): ExerciseId[] {
  const bank = buildEnglishExamBank(params.level);
  const target = Math.min(params.count ?? ENGLISH_FINAL_EXAM_TARGET_COUNT, bank.length);
  const rnd = mulberry32(hashStringToUint32(`${params.pickerVersion}:${params.seed}`));
  return shuffle(bank, rnd)
    .slice(0, target)
    .map((ex) => ex.id);
}
