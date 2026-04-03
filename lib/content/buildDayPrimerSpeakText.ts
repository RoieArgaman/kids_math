import type { WorkbookDay } from "@/lib/types";

/** Max chars (summary + steps) before UI collapses by default — keep in sync with DayTeachingPrimer. */
export const DAY_PRIMER_COLLAPSE_CHAR_THRESHOLD = 900;

export function hasDayTeachingPrimer(day: WorkbookDay): boolean {
  const s = day.teachingSummary?.trim();
  if (s) return true;
  const steps = day.teachingSteps?.filter((x) => x.trim().length > 0);
  return Boolean(steps && steps.length > 0);
}

/** Plain text for Web Speech API (Hebrew). */
export function buildDayPrimerSpeakText(day: WorkbookDay): string {
  const parts: string[] = [];
  const summary = day.teachingSummary?.trim();
  if (summary) parts.push(summary);
  const steps = day.teachingSteps?.map((s) => s.trim()).filter(Boolean) ?? [];
  for (const step of steps) {
    parts.push(step);
  }
  return parts.join(". ");
}
