import type { DayId, Exercise, ExerciseId, SectionId, SkillTag } from "@/lib/types";

/** Persisted review-state schema version. Bump + migrate on any breaking shape change. */
export const REVIEW_STORAGE_SCHEMA_VERSION = 1;

/** Max spiral-review items surfaced in a single warm-up section (cognitive-load cap for G1–G2). */
export const REVIEW_WARMUP_MAX = 4;

/**
 * Leitner box level. 1 = just missed / answered wrong in review; higher = more mastered.
 * Reaching {@link GRADUATED_BOX} (5) retires the item from the active deck.
 */
export type ReviewBox = 1 | 2 | 3 | 4 | 5;

/**
 * Per-exercise spaced-repetition overlay — the "graduation" state that lets immutable
 * first-attempt-wrong history retire after re-mastery. Synced cross-device via the bundle.
 */
export interface ReviewItemState {
  exerciseId: ExerciseId;
  box: ReviewBox;
  /** ISO timestamp when this item is next due for review. */
  dueAt: string;
  /** ISO timestamp of the most recent review answer. */
  lastReviewedAt: string;
  timesSeen: number;
  timesCorrect: number;
}

/** Persisted, per-track (math grade or english) review state. */
export interface ReviewState {
  version: typeof REVIEW_STORAGE_SCHEMA_VERSION;
  items: Record<ExerciseId, ReviewItemState>;
  updatedAt: string;
}

/** A selected item to surface in the spiral-review warm-up block. */
export interface ReviewCandidate {
  exercise: Exercise;
  sourceDayId: DayId;
  sourceSectionId: SectionId;
  /** How many incorrect attempts this exercise accrued (ranking weight). */
  incorrectAttempts: number;
  /** ISO timestamp of the most recent incorrect attempt (recency tiebreak). */
  lastWrongAt: string;
  skillTags: SkillTag[];
  /** Persisted SR state for this exercise, if any (drives due-ordering). */
  reviewItem: ReviewItemState | null;
}
