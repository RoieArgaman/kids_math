import type { GradeId } from "@/lib/grades";
import { getScienceDays, type ScienceLevel } from "@/lib/content/science-workbook";
import { loadScienceProgressState } from "@/lib/science/storage";
import { loadScienceFinalExamState } from "@/lib/science/final-exam/storage";

/** The two Science levels, in order — taught as Israeli grades (כיתה א׳/ב׳). */
export const SCIENCE_LEVELS: GradeId[] = ["a", "b"];

/** Short Hebrew label for a level (Israeli grade names). */
export function scienceLevelLabel(level: ScienceLevel): string {
  return level === "b" ? "כִּיתָּה ב׳" : "כִּיתָּה א׳";
}

export function scienceLevelShortLabel(level: ScienceLevel): string {
  return level === "b" ? "כִּיתָּה ב׳" : "כִּיתָּה א׳";
}

export function scienceLevelSubtitle(level: ScienceLevel): string {
  return level === "b"
    ? "מַחֲזוֹר הַחַיִּים, גּוּף הָאָדָם, חֹמֶר וְאֶנֶרְגְּיָה"
    : "הַחוּשִׁים, בַּעֲלֵי חַיִּים, צְמָחִים וּמֶזֶג אֲוִיר";
}

/**
 * Level ב׳ is gated behind Level א׳'s final exam — mirrors how כיתה ב׳ unlocks
 * after כיתה א׳ in Math, and שלב ב׳ after שלב א׳ in English. Level א׳ is always
 * open. `previewAll` bypasses the gate.
 */
export function isScienceLevelUnlocked(level: ScienceLevel, opts?: { previewAll?: boolean }): boolean {
  if (level === "a") return true;
  if (opts?.previewAll) return true;
  return loadScienceFinalExamState("a")?.passed === true;
}

/** Whether a level's own final exam is unlocked (all its lessons complete). */
export function isScienceLevelExamUnlocked(level: ScienceLevel, opts?: { previewAll?: boolean }): boolean {
  if (opts?.previewAll) return true;
  const progress = loadScienceProgressState();
  const days = getScienceDays(level);
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete);
}
