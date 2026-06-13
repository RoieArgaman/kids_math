import { describe, expect, it } from "vitest";
import {
  evaluateMathExpression,
  resolvePromptParts,
  splitMathExpression,
  tokenizeMathExpression,
} from "@/lib/utils/mathText";

describe("splitMathExpression", () => {
  it("returns only text when no math expression exists", () => {
    expect(splitMathExpression("זו רק שאלה מילולית ללא תרגיל")).toEqual({
      text: "זו רק שאלה מילולית ללא תרגיל",
    });
  });

  it("removes dangling parenthesis from extracted math", () => {
    const result = splitMathExpression("חַשְּׁבוּ 3 + 3 + 3 = ? (שָׁלוֹשׁ פְּעָמִים שָׁלוֹשׁ)");
    expect(result.math).toBe("3 + 3 + 3 = ?");
    expect(result.text).toContain("חַשְּׁבוּ");
  });

  it("uses selected match index and keeps prefix labels", () => {
    const result = splitMathExpression("יוֹם 3: דֻּגְמָה 1 + 1. עַכְשָׁיו 7 + 5 = 12.");
    expect(result.math).toBe("7 + 5 = 12");
    expect(result.text).toContain("יוֹם 3:");
    expect(result.text).toContain("דֻּגְמָה 1 + 1.");
  });

  it("does not split number-only text", () => {
    expect(splitMathExpression("כִּתְבוּ בִּמִילִים: 63")).toEqual({
      text: "כִּתְבוּ בִּמִילִים: 63",
    });
  });
});

describe("resolvePromptParts", () => {
  // INV-FALLBACK: with no explicit field, behavior is byte-identical to splitMathExpression.
  const fallbackPrompts = [
    "זו רק שאלה מילולית ללא תרגיל",
    "חַשְּׁבוּ 3 + 3 + 3 = ? (שָׁלוֹשׁ פְּעָמִים שָׁלוֹשׁ)",
    "יוֹם 3: דֻּגְמָה 1 + 1. עַכְשָׁיו 7 + 5 = 12.",
    "כִּתְבוּ בִּמִילִים: 63",
  ];
  it.each(fallbackPrompts)("falls back to splitMathExpression when no mathExpression: %s", (prompt) => {
    expect(resolvePromptParts({ prompt })).toEqual(splitMathExpression(prompt));
  });

  it("falls back when mathExpression is malformed (no operator)", () => {
    const prompt = "כַּמָּה זֶה 7 + 5 = ?";
    expect(resolvePromptParts({ prompt, mathExpression: "42" })).toEqual(
      splitMathExpression(prompt),
    );
  });

  it("uses the explicit expression and strips it from the text when present inline", () => {
    const result = resolvePromptParts({
      prompt: "כַּמָּה זֶה 7 + 5 = ?",
      mathExpression: "7 + 5 = ?",
    });
    expect(result.math).toBe("7 + 5 = ?");
    expect(result.text).toBe("כַּמָּה זֶה");
  });

  it("keeps the full prompt as text when the explicit expression is not inline", () => {
    const result = resolvePromptParts({
      prompt: "פִּתְרוּ אֶת הַתַּרְגִּיל הַבָּא",
      mathExpression: "9 - 4 = ?",
    });
    expect(result.math).toBe("9 - 4 = ?");
    expect(result.text).toBe("פִּתְרוּ אֶת הַתַּרְגִּיל הַבָּא");
  });

  it("normalizes whitespace in the explicit expression", () => {
    const result = resolvePromptParts({ prompt: "תַּרְגִּיל", mathExpression: "  8  +  2  = ?  " });
    expect(result.math).toBe("8 + 2 = ?");
  });
});

describe("evaluateMathExpression", () => {
  it("evaluates addition and subtraction left-to-right", () => {
    expect(evaluateMathExpression("7 + 5 = ?")).toBe(12);
    expect(evaluateMathExpression("9 - 4 = ?")).toBe(5);
    expect(evaluateMathExpression("3 + 4 + 2 = ?")).toBe(9);
    expect(evaluateMathExpression("10 - 3 - 2 = ?")).toBe(5);
  });

  it("respects × ÷ precedence over + -", () => {
    expect(evaluateMathExpression("2 + 3 × 4 = ?")).toBe(14);
    expect(evaluateMathExpression("10 - 6 ÷ 2 = ?")).toBe(7);
  });

  it("evaluates the operand side, ignoring a stated result", () => {
    expect(evaluateMathExpression("7 + 5 = 12")).toBe(12);
    expect(evaluateMathExpression("7 + 5 = 99")).toBe(12);
  });

  it("returns null for non-evaluable forms", () => {
    expect(evaluateMathExpression("7 + ? = 12")).toBeNull();
    expect(evaluateMathExpression("42")).toBeNull();
    expect(evaluateMathExpression("5 apples")).toBeNull();
  });
});

describe("tokenizeMathExpression", () => {
  it("tokenizes two-operand equation", () => {
    expect(tokenizeMathExpression("5 + 7 = ?")).toEqual([
      { type: "number", value: "5" },
      { type: "operator", value: "+" },
      { type: "number", value: "7" },
      { type: "equals", value: "=" },
      { type: "question", value: "?" },
    ]);
  });

  it("tokenizes chained operands", () => {
    expect(tokenizeMathExpression("3 + 4 + 2 = ?")).toEqual([
      { type: "number", value: "3" },
      { type: "operator", value: "+" },
      { type: "number", value: "4" },
      { type: "operator", value: "+" },
      { type: "number", value: "2" },
      { type: "equals", value: "=" },
      { type: "question", value: "?" },
    ]);
  });

  it("returns null for malformed expressions", () => {
    expect(tokenizeMathExpression("5 + = ?")).toBeNull();
    expect(tokenizeMathExpression("5 apples + 2 = ?")).toBeNull();
    expect(tokenizeMathExpression("42")).toBeNull();
  });
});
