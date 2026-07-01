import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseId } from "@/lib/types";
import {
  getRetryFeedbackText,
  isAnswerCorrect,
  isNearMiss,
  NEAR_MISS_FEEDBACK_TEXT,
} from "@/lib/utils/exercise";

const makeId = (n: number): ExerciseId => `day-1-section-1-exercise-${n}` as ExerciseId;

describe("getRetryFeedbackText hinting", () => {
  it("shows hint-available nudge on third+ attempt (non-near-miss answer)", () => {
    const ex: Exercise = {
      id: makeId(1),
      kind: "number_input",
      prompt: "6 + ? = 10",
      answer: 4,
      meta: { skillTags: ["number-bonds", "addition"], difficulty: 1, representation: "abstract" },
    };
    // "1" is not near-miss (|1-4| = 3) so the attempt-3 branch fires
    const msg = getRetryFeedbackText(ex, "1", 3);
    expect(msg).toContain("רֶמֶז");
  });

  it("shows near-miss message before attempt count when answer is ±1 off", () => {
    const ex: Exercise = {
      id: makeId(2),
      kind: "number_input",
      prompt: "6 + ? = 10",
      answer: 4,
      meta: { skillTags: ["number-bonds"], difficulty: 1, representation: "abstract" },
    };
    // "3" is near-miss (|3-4| = 1) — fires regardless of attempt count
    const msg = getRetryFeedbackText(ex, "3", 3);
    expect(msg).toBe(NEAR_MISS_FEEDBACK_TEXT);
  });

  it("shows near-miss message on first attempt too", () => {
    const ex: Exercise = {
      id: makeId(3),
      kind: "number_input",
      prompt: "2 + 3",
      answer: 5,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    // "4" is a near-miss (|4-5| = 1) and matches NO misconception pattern (not 2+3, |2-3|, or 2×3),
    // so the near-miss message fires. (A misconception match would intentionally outrank near-miss.)
    const msg = getRetryFeedbackText(ex, "4", 1);
    expect(msg).toBe(NEAR_MISS_FEEDBACK_TEXT);
  });

  it("misconception feedback outranks the ±1 near-miss when both match", () => {
    const ex: Exercise = {
      id: makeId(3),
      kind: "number_input",
      prompt: "2 + 3",
      answer: 5,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    // "6" is BOTH a near-miss (|6-5| = 1) AND exactly 2×3 (multiplied instead of added).
    // The specific misconception message is more useful, so it wins.
    const msg = getRetryFeedbackText(ex, "6", 1);
    expect(msg).not.toBe(NEAR_MISS_FEEDBACK_TEXT);
    expect(msg).toContain("לְחַבֵּר");
  });

  it("does NOT show near-miss for multiple_choice kind", () => {
    const ex: Exercise = {
      id: makeId(4),
      kind: "multiple_choice",
      prompt: "כַּמָּה זֶה 2 + 2?",
      options: ["3", "4", "5"],
      answer: "4",
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    // "3" is ±1 off but kind is not number_input — should NOT be near-miss
    const msg = getRetryFeedbackText(ex, "3", 1);
    expect(msg).not.toBe(NEAR_MISS_FEEDBACK_TEXT);
  });

  it("does NOT show near-miss for answer ±2 off", () => {
    const ex: Exercise = {
      id: makeId(5),
      kind: "number_input",
      prompt: "10 - 4",
      answer: 6,
      meta: { skillTags: ["subtraction"], difficulty: 1, representation: "abstract" },
    };
    const msg = getRetryFeedbackText(ex, "4", 1);
    expect(msg).not.toBe(NEAR_MISS_FEEDBACK_TEXT);
  });
});

describe("isNearMiss", () => {
  it("returns true for number_input answer exactly 1 below correct", () => {
    const ex: Exercise = {
      id: makeId(10),
      kind: "number_input",
      prompt: "5 + 3",
      answer: 8,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "7")).toBe(true);
  });

  it("returns true for number_input answer exactly 1 above correct", () => {
    const ex: Exercise = {
      id: makeId(11),
      kind: "number_input",
      prompt: "5 + 3",
      answer: 8,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "9")).toBe(true);
  });

  it("returns false for answer 2 off", () => {
    const ex: Exercise = {
      id: makeId(12),
      kind: "number_input",
      prompt: "5 + 3",
      answer: 8,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "6")).toBe(false);
  });

  it("returns false for correct answer", () => {
    const ex: Exercise = {
      id: makeId(13),
      kind: "number_input",
      prompt: "5 + 3",
      answer: 8,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "8")).toBe(false);
  });

  it("returns false for multiple_choice kind", () => {
    const ex: Exercise = {
      id: makeId(14),
      kind: "multiple_choice",
      prompt: "בחר",
      options: ["3", "4", "5"],
      answer: "4",
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "3")).toBe(false);
  });

  it("returns false for non-numeric answer string", () => {
    const ex: Exercise = {
      id: makeId(15),
      kind: "number_input",
      prompt: "5 + 3",
      answer: 8,
      meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
    };
    expect(isNearMiss(ex, "abc")).toBe(false);
  });
});

describe("isAnswerCorrect", () => {
  it("accepts correct answer for multiple_choice", () => {
    const ex: Exercise = {
      id: makeId(20),
      kind: "multiple_choice",
      prompt: "בִּחְרוּ: בְּכַמָּה קוֹפְצִים בַּסִּדְרָה 2, 4, 6, 8?",
      options: ["1", "2", "3"],
      answer: "2",
      meta: { skillTags: ["patterns"], difficulty: 1, representation: "abstract" },
    };

    expect(isAnswerCorrect(ex, "2")).toBe(true);
  });
});
