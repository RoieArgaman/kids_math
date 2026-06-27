import type { GradeId } from "@/lib/grades";

/**
 * Top-level learning domain. Math is the original (and default) subject; English is
 * the second learning layer (Hebrew → English). New subjects are added here.
 */
export type Subject = "math" | "english" | "science";

export const DEFAULT_SUBJECT: Subject = "math";

export function parseSubjectId(input: string): Subject | null {
  const s = input.trim().toLowerCase();
  if (s === "math" || s === "english" || s === "science") {
    return s;
  }
  return null;
}

export function subjectLabel(subject: Subject): string {
  switch (subject) {
    case "english":
      return "אַנְגְּלִית";
    case "science":
      return "מַדָּעִים";
    default:
      return "חֶשְׁבּוֹן";
  }
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
  | { subject: "english" }
  | { subject: "science" };

export function isEnglishTrack(track: LearningTrack): track is { subject: "english" } {
  return track.subject === "english";
}

export function isScienceTrack(track: LearningTrack): track is { subject: "science" } {
  return track.subject === "science";
}
