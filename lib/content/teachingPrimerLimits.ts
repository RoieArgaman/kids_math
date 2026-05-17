import type { GradeId } from "@/lib/grades";

export type PrimerDayBand = "early" | "mid" | "late" | "exam";

export function primerBandForDay(dayNumber: number): PrimerDayBand {
  if (dayNumber >= 29) return "exam";
  if (dayNumber <= 7) return "early";
  if (dayNumber <= 14) return "mid";
  return "late";
}

type BandLimits = {
  minSteps: number;
  maxSteps: number;
  maxSummaryChars: number;
  maxStepChars: number;
};

const GRADE_A_LIMITS: Record<PrimerDayBand, BandLimits> = {
  early: { minSteps: 2, maxSteps: 3, maxSummaryChars: 120, maxStepChars: 90 },
  mid: { minSteps: 2, maxSteps: 4, maxSummaryChars: 150, maxStepChars: 100 },
  late: { minSteps: 2, maxSteps: 4, maxSummaryChars: 170, maxStepChars: 110 },
  exam: { minSteps: 2, maxSteps: 4, maxSummaryChars: 150, maxStepChars: 100 },
};

const GRADE_B_LIMITS: Record<PrimerDayBand, BandLimits> = {
  early: { minSteps: 2, maxSteps: 3, maxSummaryChars: 140, maxStepChars: 100 },
  mid: { minSteps: 2, maxSteps: 4, maxSummaryChars: 170, maxStepChars: 115 },
  late: { minSteps: 2, maxSteps: 4, maxSummaryChars: 190, maxStepChars: 120 },
  exam: { minSteps: 2, maxSteps: 4, maxSummaryChars: 160, maxStepChars: 110 },
};

/** Recommended max combined summary+steps length (collapse threshold is 900). */
export const PRIMER_RECOMMENDED_COMBINED_CHARS = 850;

export function primerLimitsFor(grade: GradeId, dayNumber: number): BandLimits {
  const band = primerBandForDay(dayNumber);
  return grade === "a" ? GRADE_A_LIMITS[band] : GRADE_B_LIMITS[band];
}

export function combinedPrimerCharCount(summary: string, steps: string[]): number {
  const parts: string[] = [];
  if (summary.trim()) parts.push(summary.trim());
  for (const s of steps) {
    if (s.trim()) parts.push(s.trim());
  }
  return parts.join("\n").length;
}
