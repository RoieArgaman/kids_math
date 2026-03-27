export interface SplitMathExpressionResult {
  text: string;
  math?: string;
}

export type MathTokenType = "number" | "operator" | "equals" | "question";

export interface MathExpressionToken {
  type: MathTokenType;
  value: string;
}

/** Colon excluded so labels like "יוֹם 3:" are not merged into the equation. */
const MATH_EXPRESSION_REGEX_GLOBAL = /(\d[\d\s+\-*=×÷()/.?]+)/g;
const MATH_OPERATOR_REGEX = /[+\-=×÷]/;
const MATH_TOKEN_REGEX = /(\d+(?:\.\d+)?|[+\-×÷*/=?])/g;

/**
 * Hebrew copy often ends the formula with a sentence full stop; the regex treats it as part of math.
 * Strip trailing periods only (not `3.14`-style decimals — those do not end with `.`).
 */
function stripTrailingSentencePeriodFromMath(math: string): string {
  return math.replace(/\s*\.+$/, "");
}

function stripDanglingMathSuffix(math: string): string {
  return math.replace(/\s*[+\-=×÷(]+\s*$/, "");
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
  math = stripDanglingMathSuffix(math).trim();
  if (!MATH_OPERATOR_REGEX.test(math)) {
    return { text: prompt };
  }

  const matchStart = selected.index ?? prompt.indexOf(rawMath);
  const matchEnd = matchStart + rawMath.length;
  const text = `${prompt.slice(0, matchStart)} ${prompt.slice(matchEnd)}`
    .replace(/\s{2,}/g, " ")
    .trim();
  return { text, math };
}

function classifyMathTokenValue(value: string): MathTokenType | null {
  if (/^\d+(?:\.\d+)?$/.test(value)) return "number";
  if (value === "=") return "equals";
  if (value === "?") return "question";
  if (/^[+\-×÷*/]$/.test(value)) return "operator";
  return null;
}

/**
 * Converts a math expression string into display tokens.
 * Returns null if parsing is unsafe/incomplete so callers can use a plain-text fallback.
 */
export function tokenizeMathExpression(math: string): MathExpressionToken[] | null {
  const normalized = math.replace(/\s+/g, "").trim();
  if (!normalized) return null;

  const rawTokens = normalized.match(MATH_TOKEN_REGEX);
  if (!rawTokens || rawTokens.length === 0) return null;

  // Ensure we consumed the whole expression (no unsupported characters left).
  if (rawTokens.join("") !== normalized) return null;

  const tokens: MathExpressionToken[] = [];
  for (const raw of rawTokens) {
    const type = classifyMathTokenValue(raw);
    if (!type) return null;
    tokens.push({ type, value: raw });
  }

  const numberCount = tokens.filter((token) => token.type === "number").length;
  const hasOperator = tokens.some((token) => token.type === "operator");
  if (numberCount < 2 || !hasOperator) return null;

  return tokens;
}
