import { describe, expect, it } from "vitest";

import {
  buildNumberLineJumpParams,
  knownNumberCeiling,
  numberLineJumpTail,
} from "@/lib/content/engine/number-range";
import type { GradeId } from "@/lib/grades";

describe("knownNumberCeiling", () => {
  it("scales modestly with grade A day bands", () => {
    expect(knownNumberCeiling("a", 1)).toBe(10);
    expect(knownNumberCeiling("a", 4)).toBe(10);
    expect(knownNumberCeiling("a", 5)).toBe(20);
    expect(knownNumberCeiling("a", 14)).toBe(20);
    expect(knownNumberCeiling("a", 15)).toBe(25);
    expect(knownNumberCeiling("a", 29)).toBe(25);
  });

  it("scales modestly with grade B day bands", () => {
    expect(knownNumberCeiling("b", 1)).toBe(20);
    expect(knownNumberCeiling("b", 8)).toBe(20);
    expect(knownNumberCeiling("b", 9)).toBe(25);
    expect(knownNumberCeiling("b", 18)).toBe(25);
    expect(knownNumberCeiling("b", 19)).toBe(30);
    expect(knownNumberCeiling("b", 29)).toBe(30);
  });

  it("never exceeds a modest cap of 30", () => {
    for (const grade of ["a", "b"] as GradeId[]) {
      for (let day = 1; day <= 30; day++) {
        const c = knownNumberCeiling(grade, day);
        expect(c).toBeGreaterThanOrEqual(10);
        expect(c).toBeLessThanOrEqual(30);
      }
    }
  });
});

describe("buildNumberLineJumpParams", () => {
  // Includes ceilings BELOW the current table (6, 3) to prove the usable-step
  // filter keeps the invariant even if a future band lowers the ceiling.
  const CEILINGS = [3, 6, 10, 20, 25, 30];
  const KEYS = Array.from({ length: 200 }, (_, i) => `t|${i}|s|e|suffix`);

  it("holds every content-validity invariant across a large seed × ceiling sweep", () => {
    for (const ceiling of CEILINGS) {
      for (const key of KEYS) {
        const { start, end, step, jumps } = buildNumberLineJumpParams(key, ceiling);
        expect([1, 2, 3, 5]).toContain(step);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(start).toBeLessThan(end); // start < end
        expect((end - start) % step).toBe(0); // step divides span
        expect(jumps).toBe((end - start) / step); // answer === (end-start)/step
        expect(jumps).toBeGreaterThanOrEqual(2); // answer > 0 and real movement
        expect(end).toBeLessThanOrEqual(ceiling); // stays within known-number ceiling
      }
    }
  });

  it("is deterministic — same seed key + ceiling yields the same params", () => {
    const a = buildNumberLineJumpParams("b|9|2|5|focus", 25);
    const b = buildNumberLineJumpParams("b|9|2|5|focus", 25);
    expect(a).toEqual(b);
  });

  it("produces varied answers, not clustered on 5/6", () => {
    const answers = KEYS.map((k) => buildNumberLineJumpParams(k, 25).jumps);
    const distinct = new Set(answers);
    expect(distinct.size).toBeGreaterThanOrEqual(5);
    const counts = new Map<number, number>();
    for (const a of answers) counts.set(a, (counts.get(a) ?? 0) + 1);
    const maxShare = Math.max(...counts.values()) / answers.length;
    expect(maxShare).toBeLessThanOrEqual(0.4);
  });

  it("different seed keys generally produce different lines", () => {
    const p1 = buildNumberLineJumpParams("a|1|1|1|warmup", 10);
    const p2 = buildNumberLineJumpParams("a|1|1|2|warmup", 10);
    // Not a hard guarantee for every pair, but these two must differ.
    expect(JSON.stringify(p1)).not.toBe(JSON.stringify(p2));
  });
});

describe("numberLineJumpTail", () => {
  it("uses SINGULAR jump wording for a step of 1 (spoken agreement)", () => {
    const tail = numberLineJumpTail(0, 5, 1);
    expect(tail).toContain("בְּקְפִיצָה שֶׁל 1");
    expect(tail).not.toContain("בִּקְפִיצוֹת שֶׁל 1");
  });

  it("uses PLURAL jump wording for steps >= 2", () => {
    expect(numberLineJumpTail(0, 10, 2)).toContain("בִּקְפִיצוֹת שֶׁל 2");
    expect(numberLineJumpTail(0, 15, 5)).toContain("בִּקְפִיצוֹת שֶׁל 5");
  });

  it("embeds the start and end and asks how many jumps", () => {
    const tail = numberLineJumpTail(4, 12, 2);
    expect(tail).toContain("מִ-4");
    expect(tail).toContain("עַד 12");
    expect(tail.endsWith("כַּמָּה קְפִיצוֹת?")).toBe(true);
  });
});
