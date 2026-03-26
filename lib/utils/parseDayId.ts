import type { DayId } from "@/lib/types";

/**
 * Normalize pasted URLs / typography: trim and map Unicode dashes to ASCII `-`.
 */
function normalizeDayIdInput(input: string): string {
  return input
    .trim()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212\uFE58\uFE63\uFF0D]/g, "-");
}

/**
 * Parse and validate route day ids.
 * Accepts `day-<positive integer>` (case-insensitive `day`, optional leading zeros on the number).
 */
export function parseDayId(input: string): DayId | null {
  const normalized = normalizeDayIdInput(input);
  const match = /^day-0*([1-9]\d*)$/i.exec(normalized);
  if (!match) return null;
  return `day-${match[1]}` as DayId;
}

