import { describe, expect, it } from "vitest";
import {
  buildGmatChallengeBank,
  pickGmatChallengeItems,
  pickGmatChallengePool,
} from "@/lib/gmat-challenge/picker";
import { SECTION_POOL_COUNTS, SECTION_QUESTION_COUNTS } from "@/lib/gmat-challenge/config";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";

describe("pickGmatChallengeItems", () => {
  it("returns stable deterministic counts per grade", () => {
    for (const grade of ["a", "b"] as const) {
      const a = pickGmatChallengeItems({ grade, seed: "unit-seed-a", pickerVersion: 6 });
      const b = pickGmatChallengeItems({ grade, seed: "unit-seed-a", pickerVersion: 6 });
      expect(a.quant.length).toBe(SECTION_QUESTION_COUNTS.quant);
      expect(a.verbal.length).toBe(SECTION_QUESTION_COUNTS.verbal);
      expect(a.data.length).toBe(SECTION_QUESTION_COUNTS.data);
      expect(a).toEqual(b);
      const all = [...a.quant, ...a.verbal, ...a.data];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("pickGmatChallengePool returns pool-sized counts with unique ids per grade", () => {
    for (const grade of ["a", "b"] as const) {
      const pool = pickGmatChallengePool({ grade, seed: "pool-seed-a", pickerVersion: 6 });
      expect(pool.quant.length).toBe(SECTION_POOL_COUNTS.quant);
      expect(pool.verbal.length).toBe(SECTION_POOL_COUNTS.verbal);
      expect(pool.data.length).toBe(SECTION_POOL_COUNTS.data);
      const all = [...pool.quant, ...pool.verbal, ...pool.data];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("gives different seeds different selections", () => {
    const a = pickGmatChallengeItems({ grade: "a", seed: "seed-one", pickerVersion: 6 });
    const b = pickGmatChallengeItems({ grade: "a", seed: "seed-two", pickerVersion: 6 });
    expect(a).not.toEqual(b);
  });

  it("treats pickerVersion as part of the seed", () => {
    // Bumping pickerVersion must reshuffle, otherwise the version bump could
    // not be used to invalidate stored sessions.
    const v5 = pickGmatChallengeItems({ grade: "a", seed: "same", pickerVersion: 5 });
    const v6 = pickGmatChallengeItems({ grade: "a", seed: "same", pickerVersion: 6 });
    expect(v5).not.toEqual(v6);
  });
});

describe("buildGmatChallengeBank — eligibility filter", () => {
  it("excludes the final-exam day, warmup sections, and generic prompts", () => {
    const bank = buildGmatChallengeBank("a");
    expect(bank.length).toBeGreaterThan(0);

    // No exercise from the exam day leaks into the challenge bank.
    expect(bank.every((ex) => !ex.id.startsWith(FINAL_EXAM_DAY_ID))).toBe(true);

    // Worked examples reveal the answer inside the prompt, so they must never
    // be served as questions.
    expect(bank.some((ex) => (ex.prompt ?? "").startsWith("דֻּגְמָה:"))).toBe(false);

    // Prompts too generic to stand alone without their section context.
    expect(bank.some((ex) => (ex.prompt ?? "") === "בַּחֲרוּ אֶת הַתְּשׁוּבָה הַנְּכוֹנָה.")).toBe(false);
  });

  it("has a bank large enough to fill a full session in both grades", () => {
    // If this ever fails, pickWithCounts would throw "insufficient bank" for a
    // real learner — so it is worth asserting directly rather than waiting for
    // the picker to blow up.
    const needed =
      SECTION_QUESTION_COUNTS.quant + SECTION_QUESTION_COUNTS.verbal + SECTION_QUESTION_COUNTS.data;
    for (const grade of ["a", "b"] as const) {
      expect(buildGmatChallengeBank(grade).length).toBeGreaterThanOrEqual(needed);
    }
  });

  it("keeps every bank exercise unique by id", () => {
    const bank = buildGmatChallengeBank("a");
    expect(new Set(bank.map((ex) => ex.id)).size).toBe(bank.length);
  });
});
