import type { GradeId } from "@/lib/grades";
import { getScienceDays, type ScienceLevel } from "@/lib/content/science-workbook";
import { loadScienceProgressState } from "@/lib/science/storage";
import { isSubjectUnlockedInGrade } from "@/lib/completion/subjectGrade";

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
    ? "מַחְזוֹרֵי חַיִּים, גּוּף הָאָדָם, כַּדּוּר הָאָרֶץ, חֹמֶר וּמְכוֹנוֹת"
    : "הַחוּשִׁים, בַּעֲלֵי חַיִּים, צְמָחִים, חֳמָרִים, כּוֹחוֹת וְהַסְּבִיבָה";
}

/**
 * Level ב׳ is gated behind Level א׳ being *completed* (all lessons + final exam) —
 * the single cross-grade prerequisite shared by every subject. Delegates to
 * {@link isSubjectUnlockedInGrade} so there is one definition. Level א׳ is always
 * open; `previewAll` bypasses the gate.
 */
export function isScienceLevelUnlocked(level: ScienceLevel, opts?: { previewAll?: boolean }): boolean {
  return isSubjectUnlockedInGrade("science", level, opts);
}

/** Whether a level's own final exam is unlocked (all its lessons complete). */
export function isScienceLevelExamUnlocked(level: ScienceLevel, opts?: { previewAll?: boolean }): boolean {
  if (opts?.previewAll) return true;
  const progress = loadScienceProgressState();
  const days = getScienceDays(level);
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete);
}
