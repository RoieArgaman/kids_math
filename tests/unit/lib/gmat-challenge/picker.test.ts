import { describe, expect, it } from "vitest";
import { pickGmatChallengeItems, pickGmatChallengePool } from "@/lib/gmat-challenge/picker";
import { SECTION_POOL_COUNTS, SECTION_QUESTION_COUNTS } from "@/lib/gmat-challenge/config";

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
});
