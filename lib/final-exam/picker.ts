import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID, FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { GradeId } from "@/lib/grades";
import type { Exercise, ExerciseId } from "@/lib/types";

export type PickerVersion = 1;

function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
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

export function buildFinalExamBank(grade: GradeId): Exercise[] {
  return getWorkbookDays(grade)
    .filter((d) => d.id !== FINAL_EXAM_DAY_ID)
    .flatMap((d) => d.sections.flatMap((s) => s.exercises));
}

export function pickFinalExamExerciseIds(params: {
  seed: string;
  pickerVersion: PickerVersion;
  count?: number;
  grade: GradeId;
}): ExerciseId[] {
  const count = params.count ?? FINAL_EXAM_QUESTION_COUNT;
  const bank = buildFinalExamBank(params.grade);
  const byTag = new Map<string, Exercise[]>();

  for (const ex of bank) {
    const tags = ex.meta?.skillTags ?? [];
    if (tags.length === 0) {
      byTag.set("other", [...(byTag.get("other") ?? []), ex]);
      continue;
    }
    for (const tag of tags) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), ex]);
    }
  }

  const rnd = mulberry32(hashStringToUint32(`${params.pickerVersion}:${params.seed}`));

  const tagKeys = shuffle(Array.from(byTag.keys()), rnd);
  const pools = new Map<string, Exercise[]>(tagKeys.map((k) => [k, shuffle(byTag.get(k) ?? [], rnd)]));

  const selected: Exercise[] = [];
  let safety = 0;
  while (selected.length < count && safety < 10000) {
    safety += 1;
    let progressed = false;
    for (const tag of tagKeys) {
      const pool = pools.get(tag) ?? [];
      if (pool.length === 0) {
        continue;
      }
      const ex = pool.pop();
      if (!ex) continue;
      if (!selected.some((s) => s.id === ex.id)) {
        selected.push(ex);
        progressed = true;
        if (selected.length >= count) break;
      }
    }
    if (!progressed) break;
  }

  if (selected.length < count) {
    const remaining = shuffle(
      bank.filter((ex) => !selected.some((s) => s.id === ex.id)),
      rnd,
    );
    for (const ex of remaining) {
      if (selected.length >= count) break;
      selected.push(ex);
    }
  }

  return selected.slice(0, count).map((ex) => ex.id);
}

