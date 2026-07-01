import type { Exercise } from "@/lib/types";
import { resolvePromptParts, tokenizeMathExpression } from "@/lib/utils/mathText";
import { normalizeAnswerValue, normalizeTextAnswer } from "@/lib/utils/exercise";

/**
 * A detected (or authored) arithmetic misconception, with encouraging, fix-focused
 * Hebrew feedback. The caller shows `feedback` in place of the generic retry text.
 */
export interface MisconceptionHit {
  id: string;
  feedback: string;
}

/** Clean binary LHS: exactly `number op number` (before any `=`). */
interface BinaryOperands {
  a: number;
  op: string;
  b: number;
}

/**
 * Extract the LHS operand sequence exactly like `evaluateMathExpression`, but only
 * PROCEED for the clean BINARY case (2 numbers + 1 operator). Anything else → null,
 * so we never guess a misconception from an ambiguous prompt.
 */
function parseBinaryOperands(exercise: Exercise): BinaryOperands | null {
  const math = resolvePromptParts(exercise).math;
  if (!math) return null;

  const tokens = tokenizeMathExpression(math);
  if (!tokens) return null;

  const equalsIndex = tokens.findIndex((token) => token.type === "equals");
  const lhs = equalsIndex >= 0 ? tokens.slice(0, equalsIndex) : tokens;

  // Clean alternating `number op number ...`: odd length, evens are numbers, odds ops.
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

  // ONLY the clean binary case.
  if (nums.length !== 2 || ops.length !== 1) return null;
  const [a, b] = nums;
  const op = ops[0]!;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a: a!, op, b: b! };
}

function correctResult(a: number, op: string, b: number): number | null {
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
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

/** Learner's normalized numeric answer, or null if not a finite number. */
function normalizedNumber(rawAnswer: unknown): number | null {
  const normalized = normalizeAnswerValue(rawAnswer);
  return typeof normalized === "number" && Number.isFinite(normalized) ? normalized : null;
}

/**
 * Detect a common arithmetic misconception from a learner's WRONG answer to a
 * binary math exercise, returning encouraging, fix-focused Hebrew feedback.
 *
 * CONSERVATIVE by design: fires only on an EXACT structural match (clean binary
 * `a op b`, learner answer equals a specific well-known wrong result). Otherwise
 * returns null and the caller falls back to generic feedback — we never tell a
 * child the wrong story about their mistake.
 *
 * v1 handles only `number_input` and `number_line_jump`. Off-by-one is handled
 * elsewhere (`isNearMiss`) and is deliberately NOT duplicated here.
 */
export function detectMisconception(
  exercise: Exercise,
  rawAnswer: unknown,
): MisconceptionHit | null {
  if (exercise.kind !== "number_input" && exercise.kind !== "number_line_jump") {
    return null;
  }

  const operands = parseBinaryOperands(exercise);
  if (!operands) return null;
  const { a, op, b } = operands;

  const w = normalizedNumber(rawAnswer);
  if (w === null) return null;

  const c = correctResult(a, op, b);
  if (c === null) return null;
  if (w === c) return null; // not a wrong answer

  const sum = a + b;
  const diff = Math.abs(a - b);
  const product = a * b;

  const isMul = op === "×" || op === "*";

  // Subtraction, but the learner added instead.
  if (op === "-" && w === sum) {
    return {
      id: "sub-added",
      feedback: `כִּמְעַט! נִרְאֶה שֶׁחִבַּרְתָּ. כָּאן צָרִיךְ לְהוֹרִיד — לְהַתְחִיל מֵ-${a} וּלְהוֹרִיד ${b}.`,
    };
  }

  // Addition, but the learner subtracted instead.
  if (op === "+" && w === diff) {
    return {
      id: "add-subtracted",
      feedback: "נִרְאֶה שֶׁהוֹרַדְתָּ. כָּאן צָרִיךְ לְחַבֵּר — לְהוֹסִיף אֶת שְׁנֵי הַמִּסְפָּרִים יַחַד.",
    };
  }

  // Multiplication, but the learner added instead.
  if (isMul && w === sum) {
    return {
      id: "mul-added",
      feedback: `נִרְאֶה שֶׁחִבַּרְתָּ. בְּכֶפֶל סוֹפְרִים קְבוּצוֹת שָׁווֹת — ${a} פְּעָמִים ${b}.`,
    };
  }

  // Addition, but the learner multiplied instead.
  if (op === "+" && w === product) {
    return {
      id: "add-multiplied",
      feedback: `נִרְאֶה שֶׁכָּפַלְתָּ. כָּאן צָרִיךְ לְחַבֵּר — לְהוֹסִיף אֶת ${a} וְ-${b} יַחַד.`,
    };
  }

  return null;
}

/**
 * Match an authored misconception rule (`exercise.misconceptions`) against the
 * learner's WRONG answer, using the same normalization the app uses to compare
 * answers (numeric compare for numbers; normalized-text compare for strings).
 *
 * Returns the first matching rule as `{ id: "authored:<index>", feedback }`, or
 * null. Never matches the exercise's correct answer.
 */
export function matchAuthoredMisconception(
  exercise: Exercise,
  rawAnswer: unknown,
): MisconceptionHit | null {
  const rules = exercise.misconceptions;
  if (!rules || rules.length === 0) return null;

  const normalized = normalizeAnswerValue(rawAnswer);
  if (normalized === null) return null;

  // Only match WRONG answers — never explain a correct one.
  if (isAnswerCorrectNumericOrText(exercise, normalized)) return null;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;
    if (answerMatchesRule(normalized, rule.match)) {
      return { id: `authored:${i}`, feedback: rule.feedback };
    }
  }
  return null;
}

/**
 * Whether a normalized answer equals a rule's `match`, compared the same way the
 * app compares answers: numeric equality when both are numbers, otherwise a
 * normalized-text compare consistent with `lib/utils/exercise.ts`.
 */
function answerMatchesRule(
  normalized: string | number | boolean,
  match: number | string,
): boolean {
  if (typeof match === "number") {
    return typeof normalized === "number" && normalized === match;
  }
  // String rule: compare via normalizeTextAnswer on both sides.
  return normalizeTextAnswer(String(normalized)) === normalizeTextAnswer(match);
}

/**
 * Lightweight correctness check against the already-normalized answer, mirroring the
 * relevant branches of `isAnswerCorrect` for the kinds authored rules apply to.
 * Used only to avoid explaining a correct answer.
 */
function isAnswerCorrectNumericOrText(
  exercise: Exercise,
  normalized: string | number | boolean,
): boolean {
  switch (exercise.kind) {
    case "number_input":
    case "number_line_jump":
      return typeof normalized === "number" && normalized === exercise.answer;
    case "multiple_choice":
    case "listen_choose":
      return normalizeTextAnswer(String(normalized)) === normalizeTextAnswer(exercise.answer);
    case "shape_choice":
      return String(normalized) === exercise.answer;
    default:
      return false;
  }
}
