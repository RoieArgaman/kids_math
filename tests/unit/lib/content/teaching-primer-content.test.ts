import { describe, expect, it } from "vitest";
import { buildDayPrimerSpeakChunks } from "@/lib/content/buildDayPrimerSpeakText";
import { hasDayTeachingPrimer } from "@/lib/content/buildDayPrimerSpeakText";
import {
  combinedPrimerCharCount,
  primerLimitsFor,
  PRIMER_RECOMMENDED_COMBINED_CHARS,
} from "@/lib/content/teachingPrimerLimits";
import { lintTeachingPrimerHebrew } from "@/lib/content/teachingPrimerHebrewLint";
import { getWorkbookDays } from "@/lib/content/workbook";

const UNRESOLVED_PLACEHOLDER_REGEX = /=\s*\?|(\?\s*[+\-×÷])|([+\-×÷]\s+\?(?:\s|$))/;

describe("teaching primer content", () => {
  it("every Grade A and B day has summary and steps from catalog", () => {
    for (const grade of ["a", "b"] as const) {
      const days = getWorkbookDays(grade);
      expect(days.length).toBe(29);
      for (const day of days) {
        expect(hasDayTeachingPrimer(day), `${grade} ${day.id}`).toBe(true);
        expect(day.teachingSummary?.trim().length).toBeGreaterThan(0);
        expect(day.teachingSteps?.length).toBeGreaterThanOrEqual(2);
        for (const step of day.teachingSteps ?? []) {
          expect(step.trim().length).toBeGreaterThan(0);
          expect(UNRESOLVED_PLACEHOLDER_REGEX.test(step)).toBe(false);
        }
        expect(UNRESOLVED_PLACEHOLDER_REGEX.test(day.teachingSummary ?? "")).toBe(false);
      }
    }
  });

  it("primer copy respects per-grade band limits", () => {
    for (const grade of ["a", "b"] as const) {
      for (const day of getWorkbookDays(grade)) {
        const limits = primerLimitsFor(grade, day.dayNumber);
        const steps = day.teachingSteps ?? [];
        expect(steps.length).toBeGreaterThanOrEqual(limits.minSteps);
        expect(steps.length).toBeLessThanOrEqual(limits.maxSteps);
        expect((day.teachingSummary ?? "").length).toBeLessThanOrEqual(limits.maxSummaryChars);
        for (const step of steps) {
          expect(step.length).toBeLessThanOrEqual(limits.maxStepChars);
        }
        expect(
          combinedPrimerCharCount(day.teachingSummary ?? "", steps),
        ).toBeLessThanOrEqual(PRIMER_RECOMMENDED_COMBINED_CHARS + 50);
      }
    }
  });

  it("primer Hebrew passes lint rules", () => {
    for (const grade of ["a", "b"] as const) {
      const days = getWorkbookDays(grade);
      const issues = lintTeachingPrimerHebrew(grade, days);
      expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
    }
  });

  it("buildDayPrimerSpeakChunks length matches summary plus steps", () => {
    const day = getWorkbookDays("a")[0]!;
    const chunks = buildDayPrimerSpeakChunks(day);
    const stepCount = day.teachingSteps?.filter((s) => s.trim()).length ?? 0;
    expect(chunks.length).toBe(1 + stepCount);
  });
});
