import type { ExerciseAttempt, ExerciseId } from "@/lib/types";
import type { ReviewBox, ReviewItemState, ReviewState } from "./types";

/** Reaching this box retires the item from the active spiral-review deck. */
export const GRADUATED_BOX: ReviewBox = 5;

/** Days until next due, indexed by the box the item moves INTO. Box 5 ≈ "graduated" (far future). */
const BOX_INTERVAL_DAYS: Record<ReviewBox, number> = { 1: 1, 2: 3, 3: 7, 4: 16, 5: 3650 };
const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure count of incorrect attempts (mirrors progress/engine; exported for ranking reuse). */
export function countWrongAttempts(attempts: ExerciseAttempt[]): number {
  return attempts.filter((a) => !a.isCorrect).length;
}

export function isGraduated(item: ReviewItemState): boolean {
  return item.box >= GRADUATED_BOX;
}

/** True when an active (non-graduated) item's due time has arrived. */
export function isDue(item: ReviewItemState, now: string): boolean {
  if (isGraduated(item)) return false;
  return Date.parse(item.dueAt) <= Date.parse(now);
}

function nextDueAt(box: ReviewBox, now: string): string {
  return new Date(Date.parse(now) + BOX_INTERVAL_DAYS[box] * DAY_MS).toISOString();
}

/**
 * Apply a review answer using a Leitner schedule.
 * Correct → promote one box (caps at GRADUATED_BOX); Wrong → reset to box 1.
 * A previously-unseen item starts at box 1 before the transition.
 */
export function recordReview(
  state: ReviewState,
  exerciseId: ExerciseId,
  isCorrect: boolean,
  now: string,
): ReviewState {
  const prev = state.items[exerciseId];
  const prevBox: ReviewBox = prev?.box ?? 1;
  const nextBox: ReviewBox = isCorrect
    ? (Math.min(prevBox + 1, GRADUATED_BOX) as ReviewBox)
    : 1;

  const item: ReviewItemState = {
    exerciseId,
    box: nextBox,
    dueAt: nextDueAt(nextBox, now),
    lastReviewedAt: now,
    timesSeen: (prev?.timesSeen ?? 0) + 1,
    timesCorrect: (prev?.timesCorrect ?? 0) + (isCorrect ? 1 : 0),
  };

  return {
    ...state,
    items: { ...state.items, [exerciseId]: item },
    updatedAt: now,
  };
}
