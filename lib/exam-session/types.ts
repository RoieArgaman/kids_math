/**
 * Generic timed multi-section exam session (content-agnostic).
 * Product-specific exams (e.g. gmat-challenge) compose this contract.
 */

export type ExamPhase =
  | "rules"
  | "pickOrder"
  | "sectionActive"
  | "sectionReview"
  | "break"
  | "results";

export interface ExamSessionSectionSpec {
  key: string;
  itemIds: string[];
  /** Wall-clock duration when the official exam uses 45 minutes for this section ratio. */
  durationMs: number;
}
