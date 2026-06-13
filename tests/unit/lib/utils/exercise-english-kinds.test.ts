import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseId } from "@/lib/types";
import { isAnswerCorrect } from "@/lib/utils/exercise";

const makeId = (n: number): ExerciseId => `day-1-section-1-exercise-${n}` as ExerciseId;

describe("isAnswerCorrect — English layer kinds", () => {
  it("grades listen_choose like a single-value choice", () => {
    const ex: Exercise = {
      id: makeId(1),
      kind: "listen_choose",
      prompt: "מָה שָׁמַעְתֶּם?",
      audioText: "red",
      options: ["אָדוֹם", "כָּחוֹל", "יָרוֹק"],
      answer: "אָדוֹם",
      meta: { skillTags: [], difficulty: 1, representation: "abstract" },
    };

    expect(isAnswerCorrect(ex, "אָדוֹם")).toBe(true);
    expect(isAnswerCorrect(ex, "כָּחוֹל")).toBe(false);
  });

  it("grades letter_tiles against the target word, case/space-insensitive", () => {
    const ex: Exercise = {
      id: makeId(2),
      kind: "letter_tiles",
      prompt: "הַרְכִּיבוּ אֶת הַמִּלָּה",
      word: "cat",
      meta: { skillTags: [], difficulty: 1, representation: "abstract" },
    };

    expect(isAnswerCorrect(ex, "cat")).toBe(true);
    expect(isAnswerCorrect(ex, "CAT")).toBe(true);
    expect(isAnswerCorrect(ex, "dog")).toBe(false);
    expect(isAnswerCorrect(ex, "")).toBe(false);
  });

  it("grades match_pairs only when every pair is matched correctly", () => {
    const ex: Exercise = {
      id: makeId(3),
      kind: "match_pairs",
      prompt: "הַתְאִימוּ",
      pairs: [
        { left: "red", right: "אָדוֹם" },
        { left: "blue", right: "כָּחוֹל" },
      ],
      meta: { skillTags: [], difficulty: 1, representation: "abstract" },
    };

    expect(isAnswerCorrect(ex, JSON.stringify({ red: "אָדוֹם", blue: "כָּחוֹל" }))).toBe(true);
    // Wrong mapping
    expect(isAnswerCorrect(ex, JSON.stringify({ red: "כָּחוֹל", blue: "אָדוֹם" }))).toBe(false);
    // Incomplete
    expect(isAnswerCorrect(ex, JSON.stringify({ red: "אָדוֹם" }))).toBe(false);
    // Empty / malformed
    expect(isAnswerCorrect(ex, "")).toBe(false);
    expect(isAnswerCorrect(ex, "not json")).toBe(false);
  });
});
