import type { WorkbookDay } from "@/lib/types";

/** Max chars (summary + steps) before UI collapses by default — keep in sync with DayTeachingPrimer. */
export const DAY_PRIMER_COLLAPSE_CHAR_THRESHOLD = 900;

export function hasDayTeachingPrimer(day: WorkbookDay): boolean {
  const s = day.teachingSummary?.trim();
  if (s) return true;
  const steps = day.teachingSteps?.filter((x) => x.trim().length > 0);
  return Boolean(steps && steps.length > 0);
}

/** One speak chunk per summary line and per step (primer TTS). */
export function buildDayPrimerSpeakChunks(day: WorkbookDay): string[] {
  const chunks: string[] = [];
  const summary = day.teachingSummary?.trim();
  if (summary) chunks.push(summary);
  const steps = day.teachingSteps?.map((s) => s.trim()).filter(Boolean) ?? [];
  const stepLabels = ["שָׁלָב שֵׁנִי", "שָׁלָב שְׁלִישִׁי", "שָׁלָב רְבִיעִי"];
  const labelSteps = Boolean(summary);
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const label = labelSteps ? stepLabels[i] : undefined;
    chunks.push(label ? `${label}: ${step}` : step);
  }
  return chunks;
}

/** Plain text for Web Speech API (Hebrew). */
export function buildDayPrimerSpeakText(day: WorkbookDay): string {
  return buildDayPrimerSpeakChunks(day).join(". ");
}
