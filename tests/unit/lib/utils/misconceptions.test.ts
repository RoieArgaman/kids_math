import { describe, expect, it } from "vitest";
import type { CurriculumMeta, Exercise, ExerciseId, MisconceptionRule } from "@/lib/types";
import { detectMisconception, matchAuthoredMisconception } from "@/lib/utils/misconceptions";

const makeId = (n: number): ExerciseId => `day-1-section-1-exercise-${n}` as ExerciseId;

const meta: CurriculumMeta = {
  skillTags: ["addition"],
  difficulty: 1,
  representation: "abstract",
};

interface NumberInputOverrides {
  prompt: string;
  answer: number;
  mathExpression?: string;
  misconceptions?: MisconceptionRule[];
}

const numberInput = (o: NumberInputOverrides): Exercise => ({
  id: makeId(1),
  kind: "number_input",
  prompt: o.prompt,
  answer: o.answer,
  mathExpression: o.mathExpression,
  misconceptions: o.misconceptions,
  meta,
});

describe("detectMisconception — exact structural matches", () => {
  it("sub-added: '8 - 3 = ?' answer 5, learner 11 (=8+3) → sub-added with real numbers", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    const hit = detectMisconception(ex, 11);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("sub-added");
    expect(hit!.feedback).toContain("8");
    expect(hit!.feedback).toContain("3");
  });

  it("add-subtracted: '4 + 5 = ?' answer 9, learner 1 (=|4-5|) → add-subtracted", () => {
    const ex = numberInput({ prompt: "4 + 5 = ?", answer: 9 });
    const hit = detectMisconception(ex, 1);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("add-subtracted");
  });

  it("mul-added: '3 × 4 = ?' answer 12, learner 7 (=3+4) → mul-added with real numbers", () => {
    const ex = numberInput({ prompt: "3 × 4 = ?", answer: 12 });
    const hit = detectMisconception(ex, 7);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("mul-added");
    expect(hit!.feedback).toContain("3");
    expect(hit!.feedback).toContain("4");
  });

  it("mul-added works via '*' operator too", () => {
    const ex = numberInput({ prompt: "3 * 4 = ?", answer: 12 });
    const hit = detectMisconception(ex, 7);
    expect(hit!.id).toBe("mul-added");
  });

  it("add-multiplied: '2 + 3 = ?' answer 5, learner 6 (=2*3) → add-multiplied", () => {
    const ex = numberInput({ prompt: "2 + 3 = ?", answer: 5 });
    const hit = detectMisconception(ex, 6);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("add-multiplied");
    expect(hit!.feedback).toContain("2");
    expect(hit!.feedback).toContain("3");
  });

  it("works for number_line_jump too", () => {
    const ex: Exercise = {
      id: makeId(2),
      kind: "number_line_jump",
      prompt: "8 - 3 = ?",
      start: 0,
      end: 8,
      step: 1,
      answer: 5,
      meta,
    };
    const hit = detectMisconception(ex, 11);
    expect(hit!.id).toBe("sub-added");
  });

  it("uses explicit mathExpression when present", () => {
    const ex = numberInput({
      prompt: "כמה זה יחד?",
      mathExpression: "8 - 3 = ?",
      answer: 5,
    });
    const hit = detectMisconception(ex, 11);
    expect(hit!.id).toBe("sub-added");
  });
});

describe("detectMisconception — false-positive guards", () => {
  it("wrong answer matching NO pattern → null ('8 - 3 = ?' learner 6)", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    expect(detectMisconception(ex, 6)).toBeNull();
  });

  it("correct answer → null", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    expect(detectMisconception(ex, 5)).toBeNull();
  });

  it("non-numeric answer → null", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    expect(detectMisconception(ex, "שלוש")).toBeNull();
  });

  it("empty answer → null", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    expect(detectMisconception(ex, "")).toBeNull();
    expect(detectMisconception(ex, null)).toBeNull();
    expect(detectMisconception(ex, undefined)).toBeNull();
  });

  it("multi-term prompt → null ('2 + 3 + 4 = ?')", () => {
    const ex = numberInput({ prompt: "2 + 3 + 4 = ?", answer: 9 });
    // 2 + 3 + 4: learner 1 doesn't match binary patterns and it's not binary anyway
    expect(detectMisconception(ex, 5)).toBeNull();
    expect(detectMisconception(ex, 24)).toBeNull();
  });

  it("word problem with no parseable math → null", () => {
    const ex = numberInput({
      prompt: "לְדָנָה יֵשׁ כַּמָּה תַּפּוּחִים. כַּמָּה נִשְׁאֲרוּ?",
      answer: 5,
    });
    expect(detectMisconception(ex, 11)).toBeNull();
  });

  it("multiple_choice exercise → null (v1 numeric only)", () => {
    const ex: Exercise = {
      id: makeId(3),
      kind: "multiple_choice",
      prompt: "8 - 3 = ?",
      options: ["5", "11", "8"],
      answer: "5",
      meta,
    };
    expect(detectMisconception(ex, "11")).toBeNull();
  });

  it("true_false exercise → null (v1 numeric only)", () => {
    const ex: Exercise = {
      id: makeId(4),
      kind: "true_false",
      prompt: "8 - 3 = 5",
      answer: true,
      meta,
    };
    expect(detectMisconception(ex, false)).toBeNull();
  });

  it("does not fire when a+b coincidentally equals the correct result", () => {
    // 0 + 0 = 0; diff 0, sum 0, product 0 all equal correct → never a wrong hit.
    const ex = numberInput({ prompt: "0 + 0 = ?", answer: 0 });
    expect(detectMisconception(ex, 0)).toBeNull();
  });
});

describe("matchAuthoredMisconception", () => {
  it("returns authored hit for a matching wrong answer", () => {
    const ex = numberInput({
      prompt: "8 - 3 = ?",
      answer: 5,
      misconceptions: [{ match: 11, feedback: "חִבַּרְתָּ בְּמָקוֹם לְהוֹרִיד." }],
    });
    const hit = matchAuthoredMisconception(ex, 11);
    expect(hit).not.toBeNull();
    expect(hit!.id).toBe("authored:0");
    expect(hit!.feedback).toBe("חִבַּרְתָּ בְּמָקוֹם לְהוֹרִיד.");
  });

  it("returns null when no rule matches the (wrong) answer", () => {
    const ex = numberInput({
      prompt: "8 - 3 = ?",
      answer: 5,
      misconceptions: [{ match: 11, feedback: "..." }],
    });
    expect(matchAuthoredMisconception(ex, 7)).toBeNull();
  });

  it("returns null for the correct answer even if a rule exists", () => {
    const ex = numberInput({
      prompt: "8 - 3 = ?",
      answer: 5,
      misconceptions: [{ match: 5, feedback: "should never show" }],
    });
    expect(matchAuthoredMisconception(ex, 5)).toBeNull();
  });

  it("returns null when there are no authored rules", () => {
    const ex = numberInput({ prompt: "8 - 3 = ?", answer: 5 });
    expect(matchAuthoredMisconception(ex, 11)).toBeNull();
  });

  it("returns null for empty/non-parseable answer", () => {
    const ex = numberInput({
      prompt: "8 - 3 = ?",
      answer: 5,
      misconceptions: [{ match: 11, feedback: "..." }],
    });
    expect(matchAuthoredMisconception(ex, "")).toBeNull();
    expect(matchAuthoredMisconception(ex, null)).toBeNull();
  });

  it("picks the first matching rule when several match", () => {
    const ex = numberInput({
      prompt: "8 - 3 = ?",
      answer: 5,
      misconceptions: [
        { match: 11, feedback: "first" },
        { match: 11, feedback: "second" },
      ],
    });
    const hit = matchAuthoredMisconception(ex, 11);
    expect(hit!.id).toBe("authored:0");
    expect(hit!.feedback).toBe("first");
  });

  it("matches a string rule on a multiple_choice wrong option", () => {
    const ex: Exercise = {
      id: makeId(5),
      kind: "multiple_choice",
      prompt: "8 - 3 = ?",
      options: ["5", "11"],
      answer: "5",
      misconceptions: [{ match: "11", feedback: "חִבַּרְתָּ." }],
      meta,
    };
    const hit = matchAuthoredMisconception(ex, "11");
    expect(hit!.id).toBe("authored:0");
  });
});
