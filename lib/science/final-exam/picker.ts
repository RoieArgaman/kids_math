import { getScienceDays, type ScienceLevel } from "@/lib/content/science-workbook";
import type { Exercise, ExerciseId } from "@/lib/types";
import { SCIENCE_FINAL_EXAM_TARGET_COUNT } from "@/lib/science/final-exam/config";

export type PickerVersion = 1;

function hashStringToUint32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

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
