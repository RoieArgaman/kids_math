export interface SplitMathExpressionResult {
  text: string;
  math?: string;
}

const MATH_EXPRESSION_REGEX_GLOBAL = /(\d[\d\s+\-*=×÷()/.?:]+)/g;
const MATH_OPERATOR_REGEX = /[+\-=×÷]/;

export function splitMathExpression(prompt: string): SplitMathExpressionResult {
  const matches = Array.from(prompt.matchAll(MATH_EXPRESSION_REGEX_GLOBAL));
  if (matches.length === 0) {
    return { text: prompt };
  }

  // When a prompt contains both an example and a question formula,
  // we want the last expression (usually the one to solve now).
  const selected = matches[matches.length - 1];
  const rawMath = selected[1];
  const math = rawMath.trim();
  if (!MATH_OPERATOR_REGEX.test(math)) {
    return { text: prompt };
  }

  const text = prompt.replace(rawMath, "").replace(/\s{2,}/g, " ").trim();
  return { text, math };
}
