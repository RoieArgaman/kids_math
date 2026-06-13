import type { DayConcept } from "./exercise-factories";
import type { Exercise } from "@/lib/types";
import { evaluateMathExpression, tokenizeMathExpression } from "@/lib/utils/mathText";
import { resolvePromptParts } from "@/lib/utils/mathText";

function numericAnswer(ex: Exercise): number | null {
  if (ex.kind === "number_input") return ex.answer;
  if (ex.kind === "multiple_choice") {
    const n = Number(ex.answer);
    return Number.isFinite(n) && ex.answer.trim() !== "" ? n : null;
  }
  return null;
}

/**
 * Deterministic arithmetic accuracy backstop (Case B of docs/AI_MIGRATION_PLAN.md).
 *
 * Conservative by design: only flags a clear contradiction in an unambiguously evaluable
 * prompt. Returns `null` (skip) for anything not in clean `number (op number)+ = number|?`
 * form, so it never false-flags word problems, place-value, ranges, etc.
 *
 *  - "a + b = c" with a stated numeric c → c must equal the computed result.
 *  - "a + b = ?" → the exercise's numeric answer must equal the computed result.
 */
export function validateExerciseArithmetic(ex: Exercise): string | null {
  const math = resolvePromptParts(ex).math;
  if (!math) return null;

  const computed = evaluateMathExpression(math);
  if (computed === null) return null;

  const tokens = tokenizeMathExpression(math);
  if (!tokens) return null;
  const equalsIndex = tokens.findIndex((t) => t.type === "equals");
  const rhs = equalsIndex >= 0 ? tokens.slice(equalsIndex + 1) : [];
  if (rhs.length !== 1) return null;

  if (rhs[0]!.type === "number") {
    const consistent = Number(rhs[0]!.value) === computed;
    // true_false deliberately states equations that may be wrong; the boolean answer
    // must match whether the equation actually holds.
    if (ex.kind === "true_false") {
      if (ex.answer !== consistent) {
        return `true_false mismatch in "${ex.id}": "${math}" is ${
          consistent ? "correct" : "incorrect"
        }, but answer is ${ex.answer}`;
      }
      return null;
    }
    // For other kinds, a fully-stated equation may be DELIBERATELY wrong (e.g.
    // "fix the mistake: 33 + 2 = 34. what is correct?"), so we cannot treat an
    // inconsistency as an error — skip rather than false-flag.
    return null;
  }

  if (rhs[0]!.type === "question") {
    const answer = numericAnswer(ex);
    if (answer !== null && answer !== computed) {
      return `answer mismatch in "${ex.id}": "${math}" expects ${computed}, exercise answer is ${answer}`;
    }
  }
  return null;
}

export function validateDayConcept(c: DayConcept): string[] {
  const errors: string[] = [];
  if (!c.title) errors.push("missing title");
  if (!c.objective) errors.push("missing objective");
  if (!c.arithmeticMcOptions.includes(c.arithmeticMcAnswer))
    errors.push(
      `arithmeticMcAnswer "${c.arithmeticMcAnswer}" not in options [${c.arithmeticMcOptions.join(", ")}]`,
    );
  if (c.geometryPrompt && !c.geometryAnswer)
    errors.push("geometryPrompt present but geometryAnswer missing");
  if (c.geometryAnswer && !c.geometryPrompt)
    errors.push("geometryAnswer present but geometryPrompt missing");
  return errors;
}
