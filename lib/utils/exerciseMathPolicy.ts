import type { Exercise } from "@/lib/types";
import type { MathExpressionToken } from "@/lib/utils/mathText";

function isNumericExercise(exercise: Exercise): boolean {
  return (
    exercise.kind === "number_input" ||
    exercise.kind === "number_line_jump" ||
    exercise.kind === "multiple_choice" ||
    exercise.kind === "true_false"
  );
}

function ensureQuestionFormTokens(tokens: MathExpressionToken[]): MathExpressionToken[] {
  const hasEquals = tokens.some((token) => token.type === "equals");
  const hasQuestion = tokens.some((token) => token.type === "question");
  const next = [...tokens];
  if (!hasEquals) {
    if (hasQuestion) {
      const qIdx = next.findIndex((token) => token.type === "question");
      next.splice(qIdx, 0, { type: "equals", value: "=" });
    } else {
      next.push({ type: "equals", value: "=" });
    }
  }
  if (!hasQuestion) {
    // Don't append "?" to a complete equation that already has a numeric answer
    // (e.g. "39 + 2 = 40" — the input field below is sufficient).
    const lastToken = next[next.length - 1];
    if (lastToken?.type !== "number") {
      next.push({ type: "question", value: "?" });
    }
  }
  return next;
}

function ensureFullExpressionTokens(tokens: MathExpressionToken[]): MathExpressionToken[] {
  if (tokens[tokens.length - 1]?.type === "question") {
    return tokens.slice(0, -1);
  }
  return tokens;
}

export function getRenderableMathTokens(
  exercise: Exercise,
  tokens: MathExpressionToken[] | null,
): MathExpressionToken[] | undefined {
  if (!isNumericExercise(exercise) || !Array.isArray(tokens) || tokens.length === 0) {
    return undefined;
  }
  if (exercise.kind === "true_false") {
    return ensureFullExpressionTokens(tokens);
  }
  return ensureQuestionFormTokens(tokens);
}
