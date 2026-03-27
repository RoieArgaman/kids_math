/**
 * Scale real GMAT Focus 45-minute sections to a shorter child exam while preserving ratio.
 */
export function scaledSectionDurationMs(params: {
  sectionQuestionCount: number;
  officialSectionQuestionCount: number;
  officialSectionMinutes?: number;
}): number {
  const minutes = params.officialSectionMinutes ?? 45;
  const ratio = params.sectionQuestionCount / params.officialSectionQuestionCount;
  return Math.round(minutes * 60 * 1000 * ratio);
}
