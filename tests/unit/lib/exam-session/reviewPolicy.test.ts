import { describe, expect, it } from "vitest";
import { countReviewDivergences, wouldExceedReviewLimit } from "@/lib/exam-session/reviewPolicy";

describe("reviewPolicy", () => {
  const ids = [
    "day-1-section-1-exercise-1",
    "day-1-section-1-exercise-2",
    "day-1-section-1-exercise-3",
    "day-1-section-1-exercise-4",
  ] as const;

  it("counts divergences vs snapshot", () => {
    const snapshot = { [ids[0]]: "1", [ids[1]]: "2", [ids[2]]: "3" };
    const answers = { [ids[0]]: "9", [ids[1]]: "2", [ids[2]]: "3" };
    expect(countReviewDivergences(answers, snapshot, ids.slice(0, 3))).toBe(1);
  });

  it("detects when next change would exceed limit", () => {
    const snapshot = { [ids[0]]: "1", [ids[1]]: "1", [ids[2]]: "1", [ids[3]]: "1" };
    const answers = { [ids[0]]: "2", [ids[1]]: "3", [ids[2]]: "4", [ids[3]]: "1" };
    expect(countReviewDivergences(answers, snapshot, ids)).toBe(3);
    expect(wouldExceedReviewLimit(answers, snapshot, ids, ids[3], "9", 3)).toBe(true);
  });
});
