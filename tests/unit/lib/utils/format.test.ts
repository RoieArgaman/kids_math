import { describe, expect, it } from "vitest";
import { formatClock, formatHebrewDate, formatMinutes } from "@/lib/utils/format";

describe("formatHebrewDate", () => {
  it("returns an em-dash for null", () => {
    expect(formatHebrewDate(null)).toBe("—");
  });

  it("returns an em-dash for an unparseable string", () => {
    expect(formatHebrewDate("not-a-date")).toBe("—");
    expect(formatHebrewDate("")).toBe("—");
  });

  it("formats a valid ISO date as he-IL day + short month", () => {
    const expected = new Date("2024-03-15T10:00:00Z").toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
    });
    expect(formatHebrewDate("2024-03-15T10:00:00Z")).toBe(expected);
  });
});

describe("formatMinutes", () => {
  it("returns 0 minutes for zero ms", () => {
    expect(formatMinutes(0)).toBe("0 דק׳");
  });

  it("clamps negative ms to 0 minutes", () => {
    expect(formatMinutes(-60000)).toBe("0 דק׳");
  });

  it("rounds ms to the nearest whole minute", () => {
    expect(formatMinutes(60000)).toBe("1 דק׳");
    expect(formatMinutes(90000)).toBe("2 דק׳"); // 1.5 min → 2 (round half up)
    expect(formatMinutes(89000)).toBe("1 דק׳"); // 1.483 min → 1
    expect(formatMinutes(150000)).toBe("3 דק׳"); // 2.5 min → 3
  });

  it("reflects NaN input in its output (no silent coercion)", () => {
    // Math.max(0, Math.round(NaN)) === NaN — documents current behavior so a
    // future change to add NaN-guarding is a deliberate, test-visible decision.
    expect(formatMinutes(NaN)).toBe("NaN דק׳");
  });
});

describe("formatClock", () => {
  it("formats zero seconds as 0:00", () => {
    expect(formatClock(0)).toBe("0:00");
  });

  it("clamps negative seconds to 0:00", () => {
    expect(formatClock(-5)).toBe("0:00");
  });

  it("pads the seconds component to two digits", () => {
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(60)).toBe("1:00");
    expect(formatClock(61)).toBe("1:01");
  });

  it("formats multi-minute values", () => {
    expect(formatClock(125)).toBe("2:05");
    expect(formatClock(599)).toBe("9:59");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(3599)).toBe("59:59");
  });
});
