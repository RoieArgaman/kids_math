import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import type { GradeId } from "@/lib/grades";
import type { Exercise, ExerciseId } from "@/lib/types";
import { classifyGmatSection } from "./classifier";
import { SECTION_QUESTION_COUNTS } from "./config";
import type { GmatSectionKey } from "./types";

export type GmatPickerVersion = 1;

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

export function buildGmatChallengeBank(grade: GradeId): Exercise[] {
  return getWorkbookDays(grade)
    .filter((d) => d.id !== FINAL_EXAM_DAY_ID)
    .flatMap((d) => d.sections.flatMap((s) => s.exercises));
}

export function pickGmatChallengeItems(params: {
  seed: string;
  pickerVersion: GmatPickerVersion;
  grade: GradeId;
}): Record<GmatSectionKey, ExerciseId[]> {
  const rnd = mulberry32(hashStringToUint32(`${params.pickerVersion}:${params.seed}`));
  const bank = buildGmatChallengeBank(params.grade);
  const byBucket: Record<GmatSectionKey, Exercise[]> = { quant: [], verbal: [], data: [] };
  for (const ex of bank) {
    const k = classifyGmatSection(ex);
    byBucket[k].push(ex);
  }

  const out: Record<GmatSectionKey, ExerciseId[]> = { quant: [], verbal: [], data: [] };
  const selectedIds = new Set<ExerciseId>();

  const keys: GmatSectionKey[] = ["quant", "verbal", "data"];
  for (const key of keys) {
    const need = SECTION_QUESTION_COUNTS[key];
    const pool = shuffle(byBucket[key], rnd);
    for (const ex of pool) {
      if (out[key].length >= need) break;
      if (!selectedIds.has(ex.id)) {
        selectedIds.add(ex.id);
        out[key].push(ex.id);
      }
    }
  }

  const leftovers = shuffle(
    bank.filter((ex) => !selectedIds.has(ex.id)),
    rnd,
  );

  for (const key of keys) {
    const need = SECTION_QUESTION_COUNTS[key];
    let i = 0;
    while (out[key].length < need && i < leftovers.length) {
      const ex = leftovers[i];
      i += 1;
      if (selectedIds.has(ex.id)) continue;
      selectedIds.add(ex.id);
      out[key].push(ex.id);
    }
  }

  for (const key of keys) {
    const need = SECTION_QUESTION_COUNTS[key];
    if (out[key].length < need) {
      throw new Error(`gmat-challenge: insufficient bank for section ${key} (grade ${params.grade})`);
    }
    out[key] = out[key].slice(0, need);
  }

  return out;
}
