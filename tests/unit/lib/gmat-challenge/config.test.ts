import { describe, expect, it } from "vitest";
import {
  GMAT_BREAK_DURATION_MS,
  GMAT_SECTION_KEYS,
  OFFICIAL_GMAT_FOCUS_COUNTS,
  SECTION_POOL_COUNTS,
  SECTION_QUESTION_COUNTS,
  gmatBreakDurationMs,
  gmatSectionDurationMs,
} from "@/lib/gmat-challenge/config";

// These two functions decide how long a child sits in front of a timed section.
// They also carry the E2E short-timer escape hatch, which must shorten the
// clock in tests without ever leaking into a real session.

describe("gmat config — section durations", () => {
  it.each(GMAT_SECTION_KEYS.map((k) => [k] as const))(
    "scales %s from the official GMAT Focus ratio",
    (key) => {
      // 45 official minutes * (our question count / official count).
      const expected = Math.round(
        45 * 60 * 1000 * (SECTION_QUESTION_COUNTS[key] / OFFICIAL_GMAT_FOCUS_COUNTS[key]),
      );
      expect(gmatSectionDurationMs(key, false)).toBe(expected);
    },
  );

  it("gives every section a duration of at least a minute in real play", () => {
    for (const key of GMAT_SECTION_KEYS) {
      expect(gmatSectionDurationMs(key, false)).toBeGreaterThan(60_000);
    }
  });

  it("caps every section at 8s when the E2E short-timer flag is on", () => {
    for (const key of GMAT_SECTION_KEYS) {
      expect(gmatSectionDurationMs(key, true)).toBe(8000);
    }
  });

  it("the short-timer flag only ever shortens, never lengthens", () => {
    for (const key of GMAT_SECTION_KEYS) {
      expect(gmatSectionDurationMs(key, true)).toBeLessThanOrEqual(
        gmatSectionDurationMs(key, false),
      );
    }
  });

  it("gives verbal the longest section, matching its larger question count", () => {
    const quant = gmatSectionDurationMs("quant", false);
    const verbal = gmatSectionDurationMs("verbal", false);
    expect(verbal).toBeGreaterThan(quant);
  });
});

describe("gmat config — break duration", () => {
  it("is the full 10 minutes in real play", () => {
    expect(gmatBreakDurationMs(false)).toBe(GMAT_BREAK_DURATION_MS);
    expect(GMAT_BREAK_DURATION_MS).toBe(10 * 60 * 1000);
  });

  it("collapses to 3s under the E2E short-timer flag", () => {
    expect(gmatBreakDurationMs(true)).toBe(3000);
  });
});

describe("gmat config — question and pool counts", () => {
  it("totals 22 questions across the three sections", () => {
    const total = GMAT_SECTION_KEYS.reduce((sum, k) => sum + SECTION_QUESTION_COUNTS[k], 0);
    expect(total).toBe(22);
  });

  it("keeps every pool at least twice its section's question count", () => {
    // The picker draws the session from the pool; too small a pool would make
    // adaptive selection degenerate to "every question, every time".
    for (const key of GMAT_SECTION_KEYS) {
      expect(SECTION_POOL_COUNTS[key]).toBeGreaterThanOrEqual(SECTION_QUESTION_COUNTS[key] * 2);
    }
  });

  it("defines all three sections in every count map", () => {
    for (const key of GMAT_SECTION_KEYS) {
      expect(SECTION_QUESTION_COUNTS[key]).toBeGreaterThan(0);
      expect(SECTION_POOL_COUNTS[key]).toBeGreaterThan(0);
      expect(OFFICIAL_GMAT_FOCUS_COUNTS[key]).toBeGreaterThan(0);
    }
  });
});
