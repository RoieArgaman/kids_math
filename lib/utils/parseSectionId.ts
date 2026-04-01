import type { SectionId } from "@/lib/types";

/**
 * Normalize pasted URLs / typography: trim and map Unicode dashes to ASCII `-`.
 */
function normalizeSectionIdInput(input: string): string {
  return input
    .trim()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212\uFE58\uFE63\uFF0D]/g, "-");
}

/**
 * Parse and validate route section ids.
 * Accepts `day-<positive integer>-section-<non-negative integer>` (case-insensitive).
 * Section index 0 is valid (warmup).
 */
export function parseSectionId(input: string): SectionId | null {
  const normalized = normalizeSectionIdInput(input);
  const match = /^day-0*([1-9]\d*)-section-0*(\d+)$/i.exec(normalized);
  if (!match) return null;
  return `day-${match[1]}-section-${match[2]}` as SectionId;
}
