import { describe, expect, it } from "vitest";
import type { ExerciseAttempt, ExerciseId } from "@/lib/types";
import {
  GRADUATED_BOX,
  countWrongAttempts,
  isDue,
  isGraduated,
  recordReview,
} from "@/lib/review/engine";
import { createInitialReviewState } from "@/lib/review/storage";
import type { ReviewBox, ReviewItemState, ReviewState } from "@/lib/review/types";

const NOW = "2024-01-10T00:00:00.000Z";
const EX: ExerciseId = "day-1-section-1-exercise-1";

function attempt(isCorrect: boolean, attemptedAt: string): ExerciseAttempt {
  return { exerciseId: EX, answer: 1, isCorrect, attemptedAt };
}

function itemAt(box: ReviewBox, overrides: Partial<ReviewItemState> = {}): ReviewItemState {
  return {
    exerciseId: EX,
    box,
    dueAt: NOW,
    lastReviewedAt: NOW,
    timesSeen: 1,
    timesCorrect: 0,
    ...overrides,
  };
}

function stateWith(item?: ReviewItemState): ReviewState {
  const base = createInitialReviewState(NOW);
  return item ? { ...base, items: { [item.exerciseId]: item } } : base;
}

describe("countWrongAttempts", () => {
  it("counts only incorrect attempts", () => {
    expect(countWrongAttempts([])).toBe(0);
    expect(
      countWrongAttempts([
        attempt(false, "2024-01-01T00:00:00.000Z"),
        attempt(true, "2024-01-01T00:01:00.000Z"),
        attempt(false, "2024-01-01T00:02:00.000Z"),
      ]),
    ).toBe(2);
  });
});

describe("recordReview", () => {
  it("promotes one box on a correct answer and sets a later dueAt", () => {
    const next = recordReview(stateWith(itemAt(2)), EX, true, NOW);
    const item = next.items[EX]!;
    expect(item.box).toBe(3);
    // Box 3 interval (7d) is in the future relative to NOW.
    expect(Date.parse(item.dueAt)).toBeGreaterThan(Date.parse(NOW));
  });

  it("resets box to 1 on a wrong answer", () => {
    const next = recordReview(stateWith(itemAt(4)), EX, false, NOW);
    expect(next.items[EX]!.box).toBe(1);
  });

  it("graduates to box 5 when a box-4 item is answered correctly", () => {
    const next = recordReview(stateWith(itemAt(4)), EX, true, NOW);
    const item = next.items[EX]!;
    expect(item.box).toBe(GRADUATED_BOX);
    expect(item.box).toBe(5);
    expect(isGraduated(item)).toBe(true);
  });

  it("caps at the graduated box on further correct answers", () => {
    const next = recordReview(stateWith(itemAt(5)), EX, true, NOW);
    expect(next.items[EX]!.box).toBe(5);
  });

  it("starts a previously-unseen item at box 1 before promoting", () => {
    const fresh = recordReview(stateWith(), EX, true, NOW);
    // Unseen → box 1 → correct → box 2.
    expect(fresh.items[EX]!.box).toBe(2);
    expect(fresh.items[EX]!.timesSeen).toBe(1);
    expect(fresh.items[EX]!.timesCorrect).toBe(1);
  });

  it("increments timesSeen and timesCorrect", () => {
    const seen = itemAt(2, { timesSeen: 3, timesCorrect: 1 });
    const afterCorrect = recordReview(stateWith(seen), EX, true, NOW);
    expect(afterCorrect.items[EX]!.timesSeen).toBe(4);
    expect(afterCorrect.items[EX]!.timesCorrect).toBe(2);

    const afterWrong = recordReview(stateWith(seen), EX, false, NOW);
    expect(afterWrong.items[EX]!.timesSeen).toBe(4);
    expect(afterWrong.items[EX]!.timesCorrect).toBe(1);
  });

  it("stamps lastReviewedAt and updatedAt with now", () => {
    const next = recordReview(stateWith(itemAt(1)), EX, true, NOW);
    expect(next.items[EX]!.lastReviewedAt).toBe(NOW);
    expect(next.updatedAt).toBe(NOW);
  });
});

describe("isDue / isGraduated", () => {
  it("is due when dueAt <= now and the item is active", () => {
    const item = itemAt(2, { dueAt: "2024-01-09T00:00:00.000Z" });
    expect(isDue(item, NOW)).toBe(true);
  });

  it("is not due when dueAt is in the future", () => {
    const item = itemAt(2, { dueAt: "2024-01-11T00:00:00.000Z" });
    expect(isDue(item, NOW)).toBe(false);
  });

  it("is never due once graduated, even if dueAt is in the past", () => {
    const item = itemAt(5, { dueAt: "2000-01-01T00:00:00.000Z" });
    expect(isGraduated(item)).toBe(true);
    expect(isDue(item, NOW)).toBe(false);
  });
});
