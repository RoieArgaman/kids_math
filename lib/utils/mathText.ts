export interface SplitMathExpressionResult {
  text: string;
  math?: string;
}

/** Colon excluded so labels like "יוֹם 3:" are not merged into the equation. */
const MATH_EXPRESSION_REGEX_GLOBAL = /(\d[\d\s+\-*=×÷()/.?]+)/g;
const MATH_OPERATOR_REGEX = /[+\-=×÷]/;

/**
 * Hebrew copy often ends the formula with a sentence full stop; the regex treats it as part of math.
 * Strip trailing periods only (not `3.14`-style decimals — those do not end with `.`).
 */
function stripTrailingSentencePeriodFromMath(math: string): string {
  return math.replace(/\s*\.+$/, "");
}

export function splitMathExpression(prompt: string): SplitMathExpressionResult {
  const matches = Array.from(prompt.matchAll(MATH_EXPRESSION_REGEX_GLOBAL));
  if (matches.length === 0) {
    return { text: prompt };
  }

  // When a prompt contains both an example and a question formula,
  // we want the last expression (usually the one to solve now).
  const selected = matches[matches.length - 1];
  const rawMath = selected[1];
  let math = rawMath.trim();
  if (!MATH_OPERATOR_REGEX.test(math)) {
    return { text: prompt };
  }

  math = stripTrailingSentencePeriodFromMath(math);

  const text = prompt.replace(rawMath, "").replace(/\s{2,}/g, " ").trim();
  return { text, math };
}
