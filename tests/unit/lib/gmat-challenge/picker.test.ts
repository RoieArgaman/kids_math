import { describe, expect, it } from "vitest";
import { pickGmatChallengeItems } from "@/lib/gmat-challenge/picker";
import { SECTION_QUESTION_COUNTS } from "@/lib/gmat-challenge/config";

describe("pickGmatChallengeItems", () => {
  it("returns stable deterministic counts per grade", () => {
    for (const grade of ["a", "b"] as const) {
      const a = pickGmatChallengeItems({ grade, seed: "unit-seed-a", pickerVersion: 1 });
      const b = pickGmatChallengeItems({ grade, seed: "unit-seed-a", pickerVersion: 1 });
      expect(a.quant.length).toBe(SECTION_QUESTION_COUNTS.quant);
      expect(a.verbal.length).toBe(SECTION_QUESTION_COUNTS.verbal);
      expect(a.data.length).toBe(SECTION_QUESTION_COUNTS.data);
      expect(a).toEqual(b);
      const all = [...a.quant, ...a.verbal, ...a.data];
      expect(new Set(all).size).toBe(all.length);
    }
  });
});
