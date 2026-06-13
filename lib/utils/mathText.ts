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

/**
 * Resolve the {text, math} render parts for an exercise, preferring an explicit
 * `mathExpression` over regex extraction from the prompt.
 *
 * Strictly additive / fail-safe (INV-FALLBACK): when `mathExpression` is absent or
 * not a valid expression (no operator), this returns exactly `splitMathExpression(prompt)`
 * — today's behavior. When present, the explicit expression is removed from the prompt
 * to form `text` (or, if not found inline, the full prompt is kept as `text`).
 */
export function resolvePromptParts(exercise: {
  prompt: string;
  mathExpression?: string;
}): SplitMathExpressionResult {
  const explicit = exercise.mathExpression?.replace(/\s+/g, " ").trim();
  if (!explicit || !MATH_OPERATOR_REGEX.test(explicit)) {
    return splitMathExpression(exercise.prompt);
  }
  const index = exercise.prompt.indexOf(explicit);
  if (index < 0) {
    return { text: exercise.prompt.replace(/\s+/g, " ").trim(), math: explicit };
  }
  const text = `${exercise.prompt.slice(0, index)} ${exercise.prompt.slice(index + explicit.length)}`
    .replace(/\s{2,}/g, " ")
    .trim();
  return { text, math: explicit };
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

function applyOperator(a: number, op: string, b: number): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
    case "*":
      return a * b;
    case "÷":
    case "/":
      return a / b;
    default:
      return NaN;
  }
}

/**
 * Evaluate the operand side (before any `=`) of a simple arithmetic expression, with
 * correct precedence (× ÷ before + -). Returns `null` for any form that is not a clean
 * `number (operator number)+` sequence, so callers (content validation) skip rather than
 * false-flag. Not used at runtime — this is a build/test-time accuracy check.
 */
export function evaluateMathExpression(math: string): number | null {
  const tokens = tokenizeMathExpression(math);
  if (!tokens) return null;

  const equalsIndex = tokens.findIndex((token) => token.type === "equals");
  const lhs = equalsIndex >= 0 ? tokens.slice(0, equalsIndex) : tokens;
  if (lhs.length === 0 || lhs.length % 2 === 0) return null;

  const nums: number[] = [];
  const ops: string[] = [];
  for (let i = 0; i < lhs.length; i++) {
    const token = lhs[i]!;
    if (i % 2 === 0) {
      if (token.type !== "number") return null;
      nums.push(Number(token.value));
    } else {
      if (token.type !== "operator") return null;
      ops.push(token.value);
    }
  }

  // Pass 1: collapse × ÷ left-to-right.
  const addNums: number[] = [nums[0]!];
  const addOps: string[] = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    const next = nums[i + 1]!;
    if (op === "×" || op === "*" || op === "÷" || op === "/") {
      addNums[addNums.length - 1] = applyOperator(addNums[addNums.length - 1]!, op, next);
    } else {
      addOps.push(op);
      addNums.push(next);
    }
  }

  // Pass 2: + - left-to-right.
  let result = addNums[0]!;
  for (let i = 0; i < addOps.length; i++) {
    result = applyOperator(result, addOps[i]!, addNums[i + 1]!);
  }
  return Number.isFinite(result) ? result : null;
}
