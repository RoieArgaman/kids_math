import { scaledSectionDurationMs } from "@/lib/exam-session";
import type { GmatSectionKey } from "./types";

export const GMAT_SECTION_KEYS: readonly GmatSectionKey[] = ["quant", "verbal", "data"];

export const SECTION_QUESTION_COUNTS: Record<GmatSectionKey, number> = {
  quant: 7,
  verbal: 8,
  data: 7,
};

export const SECTION_POOL_COUNTS: Record<GmatSectionKey, number> = {
  quant: 14,
  verbal: 16,
  data: 14,
};

/** Official GMAT Focus question counts per section type (for timing ratio). */
export const OFFICIAL_GMAT_FOCUS_COUNTS: Record<GmatSectionKey, number> = {
  quant: 21,
  verbal: 23,
  data: 20,
};

export const GMAT_BREAK_DURATION_MS = 10 * 60 * 1000;

export function gmatSectionDurationMs(key: GmatSectionKey, shortTimersForE2E: boolean): number {
  const base = scaledSectionDurationMs({
    sectionQuestionCount: SECTION_QUESTION_COUNTS[key],
    officialSectionQuestionCount: OFFICIAL_GMAT_FOCUS_COUNTS[key],
  });
  if (shortTimersForE2E) {
    return Math.min(base, 8000);
  }
  return base;
}

export function gmatBreakDurationMs(shortTimersForE2E: boolean): number {
  if (shortTimersForE2E) {
    return 3000;
  }
  return GMAT_BREAK_DURATION_MS;
}
