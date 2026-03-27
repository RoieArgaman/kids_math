import { describe, expect, it } from "vitest";
import { splitMathExpression, tokenizeMathExpression } from "@/lib/utils/mathText";

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
