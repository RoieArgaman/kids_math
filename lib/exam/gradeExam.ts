/**
 * Pure exam scorer shared by every final-exam grader (math, english, science).
 *
 * The threshold (`passPercent`) and the denominator (`total`) are ALWAYS passed
 * explicitly by the caller — this helper centralizes the arithmetic, never the
 * policy. Each subject imports its own `*_PASS_PERCENT` constant and supplies
 * its own total source (math: a fixed question count; english/science: the
 * number of selected exercises).
 *
 * Reproduces the prior per-subject math byte-for-byte:
 *   scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
 *   passed       = total > 0 && scorePercent >= passPercent
 *
 * When `total > 0` (math's fixed count is always > 0) this matches the math
 * grader's unconditional formula; the `total === 0` guard matches the
 * english/science graders, which the math grader never exercises.
 */
export function gradeExam(params: {
  correctCount: number;
  total: number;
  passPercent: number;
}): { scorePercent: number; passed: boolean } {
  const { correctCount, total, passPercent } = params;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = total > 0 && scorePercent >= passPercent;
  return { scorePercent, passed };
}
