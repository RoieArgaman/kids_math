import type { GradeId } from "@/lib/grades";
import { getEnglishDays, type EnglishLevel } from "@/lib/content/english-workbook";
import { loadEnglishProgressState } from "@/lib/english/storage";
import { loadEnglishFinalExamState } from "@/lib/english/final-exam/storage";

/** The two English levels, in order. Reuses the shared GradeId axis. */
export const ENGLISH_LEVELS: GradeId[] = ["a", "b"];

/** Short Hebrew + CEFR label for a level (do NOT use Math's gradeLabel here). */
export function englishLevelLabel(level: EnglishLevel): string {
  return level === "b" ? "שָׁלָב ב׳ · A1" : "שָׁלָב א׳ · Pre-A1";
}

export function englishLevelShortLabel(level: EnglishLevel): string {
  return level === "b" ? "שָׁלָב ב׳" : "שָׁלָב א׳";
}

export function englishLevelSubtitle(level: EnglishLevel): string {
  return level === "b"
    ? "קְרִיאָה, דִּקְדּוּק וּמִשְׁפָּטִים"
    : "הַקְשָׁבָה, הָאָלֶף־בֵּית וּמִילִּים רִאשׁוֹנוֹת";
}

/**
 * Level B is gated behind Level A's final exam — mirrors how כיתה ב׳ unlocks
 * after כיתה א׳. Level A is always open. `previewAll` bypasses the gate.
 */
export function isEnglishLevelUnlocked(level: EnglishLevel, opts?: { previewAll?: boolean }): boolean {
  if (level === "a") return true;
  if (opts?.previewAll) return true;
  return loadEnglishFinalExamState("a")?.passed === true;
}

/** Whether a level's own final exam is unlocked (all its lessons complete). */
export function isEnglishLevelExamUnlocked(level: EnglishLevel, opts?: { previewAll?: boolean }): boolean {
  if (opts?.previewAll) return true;
  const progress = loadEnglishProgressState();
  const days = getEnglishDays(level);
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete);
}
