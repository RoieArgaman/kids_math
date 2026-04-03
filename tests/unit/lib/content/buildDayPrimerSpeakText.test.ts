import { describe, expect, it } from "vitest";
import {
  buildDayPrimerSpeakText,
  hasDayTeachingPrimer,
} from "@/lib/content/buildDayPrimerSpeakText";
import type { WorkbookDay } from "@/lib/types";

function minimalDay(overrides: Partial<WorkbookDay>): WorkbookDay {
  return {
    id: "day-1",
    dayNumber: 1,
    title: "t",
    week: 1,
    objective: "o",
    spiralReviewTags: [],
    unlockThresholdPercent: 90,
    sections: [],
    ...overrides,
  };
}

describe("buildDayPrimerSpeakText", () => {
  it("returns empty when no teaching fields", () => {
    expect(buildDayPrimerSpeakText(minimalDay({}))).toBe("");
    expect(hasDayTeachingPrimer(minimalDay({}))).toBe(false);
  });

  it("joins summary and steps", () => {
    const day = minimalDay({
      teachingSummary: "אֶחָד",
      teachingSteps: ["שְׁנַיִם", "שְׁלוֹשָׁה"],
    });
    expect(buildDayPrimerSpeakText(day)).toBe("אֶחָד. שְׁנַיִם. שְׁלוֹשָׁה");
    expect(hasDayTeachingPrimer(day)).toBe(true);
  });

  it("supports steps-only", () => {
    const day = minimalDay({ teachingSteps: ["שלב"] });
    expect(hasDayTeachingPrimer(day)).toBe(true);
    expect(buildDayPrimerSpeakText(day)).toBe("שלב");
  });
});
