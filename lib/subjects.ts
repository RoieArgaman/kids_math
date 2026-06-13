import type { GradeId } from "@/lib/grades";

/**
 * Top-level learning domain. Math is the original (and default) subject; English is
 * the second learning layer (Hebrew → English). New subjects are added here.
 */
export type Subject = "math" | "english";

export const DEFAULT_SUBJECT: Subject = "math";

export function parseSubjectId(input: string): Subject | null {
  const s = input.trim().toLowerCase();
  if (s === "math" || s === "english") {
    return s;
  }
  return null;
}

export function subjectLabel(subject: Subject): string {
  return subject === "math" ? "חֶשְׁבּוֹן" : "אַנְגְּלִית";
}

/**
 * A learning track identifies "which workbook" the learner is in.
 * Math is keyed by grade (א׳/ב׳); English is a single Pre-A1 track (no grade axis).
 *
 * This is the abstraction that lets the shared screens/hooks resolve the correct
 * content list and the correct (isolated) progress store without forking them.
 */
export type LearningTrack =
  | { subject: "math"; grade: GradeId }
  | { subject: "english" };

export function isEnglishTrack(track: LearningTrack): track is { subject: "english" } {
  return track.subject === "english";
}
