import { describe, expect, it } from "vitest";

import { hashStringToUint32, mulberry32 } from "@/lib/utils/seededRandom";

describe("hashStringToUint32", () => {
  it("is deterministic for the same input", () => {
    expect(hashStringToUint32("kids")).toBe(hashStringToUint32("kids"));
  });

  it("returns a uint32 (0 .. 2^32-1)", () => {
    for (const s of ["", "a", "1:a-final-exam", "b|29|2|6|focus", "🙂"]) {
      const h = hashStringToUint32(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("differs for different inputs", () => {
    expect(hashStringToUint32("a")).not.toBe(hashStringToUint32("b"));
  });

  // GOLDEN VALUES — the exam/GMAT/science/English pickers seed from these exact
  // outputs. If these change, question selection reshuffles across deploys.
  it("matches the frozen FNV-1a golden values (guards exam-selection stability)", () => {
    expect(hashStringToUint32("1:a-final-exam")).toBe(1213339848);
    expect(hashStringToUint32("kids")).toBe(3458390908);
  });
});

describe("mulberry32", () => {
  it("produces a deterministic stream for a given seed", () => {
    const a = mulberry32(999);
    const b = mulberry32(999);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("emits floats in [0, 1)", () => {
    const r = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs for different seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it("matches frozen golden output (guards exam-selection stability)", () => {
    const r = mulberry32(12345);
    expect([r(), r(), r()].map((x) => Number(x.toFixed(10)))).toEqual([
      0.9797282678, 0.3067522645, 0.4842054215,
    ]);
  });
});
