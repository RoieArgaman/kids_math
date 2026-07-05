import type { GradeId } from "@/lib/grades";
import { hashStringToUint32, mulberry32 } from "@/lib/utils/seededRandom";

/**
 * "The number the learner knows" — a soft upper bound for auto-generated
 * number-line-jump exercises, scaled by grade + day. It intentionally stays
 * MODEST (10–30): the generated line never has to reach the ceiling, it just
 * must not exceed it. Hand-authored challenge/example prompts (which may teach
 * larger numbers) are unaffected — this only governs the generated jump lines.
 */
export function knownNumberCeiling(grade: GradeId, dayNumber: number): number {
  if (grade === "a") {
    if (dayNumber <= 4) return 10;
    if (dayNumber <= 14) return 20;
    return 25;
  }
  // grade "b"
  if (dayNumber <= 8) return 20;
  if (dayNumber <= 18) return 25;
  return 30;
}

export interface NumberLineJumpParams {
  start: number;
  end: number;
  step: 1 | 2 | 3 | 5;
  /** number of jumps === the exercise answer === (end - start) / step */
  jumps: number;
}

/** Keep jump counts countable for young learners even when the ceiling is high. */
const MAX_JUMPS = 10;

/**
 * Build a valid, varied number-line-jump within `ceiling`. Invariants hold BY
 * CONSTRUCTION (end = start + step*jumps): start < end, (end-start)%step === 0,
 * answer = jumps >= 2, end <= ceiling. `seedKey` should uniquely identify the
 * call site (include grade + day + section + exercise) so answers don't cluster
 * and Grade A/B don't collide.
 */
export function buildNumberLineJumpParams(seedKey: string, ceiling: number): NumberLineJumpParams {
  const rand = mulberry32(hashStringToUint32(seedKey));

  const stepChoices: (1 | 2 | 3 | 5)[] =
    ceiling <= 10 ? [1, 2] : ceiling <= 20 ? [1, 2, 3, 5] : [2, 3, 5];
  // Keep only steps that leave room for at least 2 jumps, so `jumps >= 2` holds
  // for ANY ceiling (>= 2), not merely today's table. Step 1 always qualifies.
  const usableSteps = stepChoices.filter((s) => Math.floor(ceiling / s) >= 2);
  const steps: (1 | 2 | 3 | 5)[] = usableSteps.length > 0 ? usableSteps : [1];
  const step = steps[Math.floor(rand() * steps.length)];

  // Highest jump count that still fits under the ceiling, capped for readability.
  const maxJumps = Math.min(MAX_JUMPS, Math.floor(ceiling / step));
  // At least 2 jumps — the line must show real movement and the answer must be > 0.
  const jumps = 2 + Math.floor(rand() * (maxJumps - 2 + 1));

  const maxStart = ceiling - step * jumps; // >= 0 because jumps <= floor(ceiling/step)
  const start = Math.floor(rand() * (maxStart + 1));
  const end = start + step * jumps;

  return { start, end, step, jumps };
}

/** Canonical spoken tail so the prompt's numbers always match the rendered line. */
export function numberLineJumpTail(start: number, end: number, step: number): string {
  // Hebrew number agreement when read aloud: singular "בְּקְפִיצָה" for a step of 1,
  // plural "בִּקְפִיצוֹת" otherwise. "קְפִיצוֹת שֶׁל 1" sounds wrong to young learners.
  const jumpPhrase = step === 1 ? "בְּקְפִיצָה שֶׁל 1" : `בִּקְפִיצוֹת שֶׁל ${step}`;
  return `מִ-${start} עַד ${end} ${jumpPhrase}. כַּמָּה קְפִיצוֹת?`;
}
