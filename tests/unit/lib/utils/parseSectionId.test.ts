import { describe, expect, it } from "vitest";
import { parseSectionId } from "@/lib/utils/parseSectionId";

describe("parseSectionId", () => {
  it("parses valid section ids", () => {
    expect(parseSectionId("day-1-section-0")).toBe("day-1-section-0");
    expect(parseSectionId("day-1-section-1")).toBe("day-1-section-1");
    expect(parseSectionId("day-22-section-3")).toBe("day-22-section-3");
    expect(parseSectionId("day-999-section-10")).toBe("day-999-section-10");
    expect(parseSectionId("  day-5-section-0  ")).toBe("day-5-section-0");
    expect(parseSectionId("Day-1-Section-0")).toBe("day-1-section-0");
    expect(parseSectionId("day-01-section-02")).toBe("day-1-section-2");
  });

  it("rejects ids with invalid day part", () => {
    expect(parseSectionId("day-0-section-0")).toBeNull();
    expect(parseSectionId("day-x-section-0")).toBeNull();
    expect(parseSectionId("section-0")).toBeNull();
    expect(parseSectionId("something")).toBeNull();
  });

  it("rejects ids missing section segment", () => {
    expect(parseSectionId("day-1")).toBeNull();
    expect(parseSectionId("day-1-section")).toBeNull();
    expect(parseSectionId("day-1-section-x")).toBeNull();
  });

  it("handles Unicode dash normalization", () => {
    // en-dash in "day‑2‑section‑0"
    expect(parseSectionId("day\u20112\u2011section\u20110")).toBe("day-2-section-0");
  });
});
