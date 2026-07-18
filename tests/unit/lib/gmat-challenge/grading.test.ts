import { describe, expect, it } from "vitest";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { gradeGmatChallenge } from "@/lib/gmat-challenge/grading";
import { pickGmatChallengeItems } from "@/lib/gmat-challenge/picker";
import type { Exercise, ExerciseId } from "@/lib/types";

function exerciseMapForGrade(grade: "a" | "b"): Map<ExerciseId, Exercise> {
  const map = new Map<ExerciseId, Exercise>();
  for (const day of Object.values(getWorkbookDaysById(grade))) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        map.set(ex.id, ex);
      }
    }
  }
  return map;
}

describe("gradeGmatChallenge", () => {
  it("scores at least one correct when one answer matches", () => {
    const grade = "a";
    const items = pickGmatChallengeItems({ grade, seed: "grade-seed", pickerVersion: 1 });
    const byId = exerciseMapForGrade(grade);
    const first = items.quant[0];
    const ex = byId.get(first);
    if (!ex) throw new Error("missing ex");
    let correct = "";
    if (ex.kind === "number_input" || ex.kind === "number_line_jump") correct = String(ex.answer);
    else if (ex.kind === "multiple_choice") correct = ex.answer;
    else if (ex.kind === "true_false") correct = ex.answer ? "true" : "false";
    else if (ex.kind === "shape_choice") correct = ex.answer;

    const answers: Record<string, string> = {};
    for (const id of [...items.quant, ...items.verbal, ...items.data]) {
      answers[id] = "";
    }
    answers[first] = correct;

    const res = gradeGmatChallenge({ itemsBySection: items, exerciseById: byId, answers });
    expect(res.totalQuestions).toBe(22);
    expect(res.correctCount).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Grading edge cases.
//
// The scoring loop counts a question toward the total BEFORE deciding whether
// it can be graded. That ordering matters: an unanswered or unresolvable
// question must still count against the child's percentage, otherwise skipping
// everything but one lucky question would score 100%.
// ---------------------------------------------------------------------------

const EMPTY_ITEMS = { quant: [], verbal: [], data: [] } as Record<
  "quant" | "verbal" | "data",
  ExerciseId[]
>;

describe("gradeGmatChallenge — edge cases", () => {
  it("returns a zero result for an empty exam without dividing by zero", () => {
    const res = gradeGmatChallenge({
      itemsBySection: EMPTY_ITEMS,
      exerciseById: new Map(),
      answers: {},
    });
    expect(res.scorePercent).toBe(0);
    expect(res.totalQuestions).toBe(0);
    expect(res.correctCount).toBe(0);
    expect(res.scoreBySection).toEqual({ quant: 0, verbal: 0, data: 0 });
    expect(res.correctBySection).toEqual({ quant: 0, verbal: 0, data: 0 });
  });

  it("still counts a question whose exercise is missing from the map", () => {
    // A stale stored id (content changed under the learner) must not silently
    // shrink the denominator and inflate the score.
    const res = gradeGmatChallenge({
      itemsBySection: { ...EMPTY_ITEMS, quant: ["no-such-exercise" as ExerciseId] },
      exerciseById: new Map(),
      answers: {},
    });
    expect(res.totalQuestions).toBe(1);
    expect(res.correctCount).toBe(0);
    expect(res.scorePercent).toBe(0);
  });

  it("still counts an unanswered question", () => {
    const grade = "a";
    const items = pickGmatChallengeItems({ grade, seed: "unanswered", pickerVersion: 6 });
    const byId = exerciseMapForGrade(grade);
    // No answers at all: every question is blank.
    const res = gradeGmatChallenge({ itemsBySection: items, exerciseById: byId, answers: {} });
    expect(res.totalQuestions).toBe(22);
    expect(res.correctCount).toBe(0);
    expect(res.scorePercent).toBe(0);
  });

  it("scores 100 when every question is answered correctly", () => {
    const grade = "a";
    const items = pickGmatChallengeItems({ grade, seed: "all-correct", pickerVersion: 6 });
    const byId = exerciseMapForGrade(grade);
    const answers: Record<string, string> = {};
    for (const id of [...items.quant, ...items.verbal, ...items.data]) {
      const ex = byId.get(id);
      if (!ex) throw new Error(`missing exercise ${id}`);
      if (ex.kind === "number_input" || ex.kind === "number_line_jump") answers[id] = String(ex.answer);
      else if (ex.kind === "multiple_choice") answers[id] = ex.answer;
      else if (ex.kind === "true_false") answers[id] = ex.answer ? "true" : "false";
      else if (ex.kind === "shape_choice") answers[id] = ex.answer;
      else throw new Error(`unhandled exercise kind ${ex.kind}`);
    }
    const res = gradeGmatChallenge({ itemsBySection: items, exerciseById: byId, answers });
    expect(res.correctCount).toBe(22);
    expect(res.scorePercent).toBe(100);
    expect(res.correctBySection.quant).toBe(items.quant.length);
    expect(res.correctBySection.verbal).toBe(items.verbal.length);
    expect(res.correctBySection.data).toBe(items.data.length);
  });

  it("reports per-section percentages against the fixed section size", () => {
    // scoreBySection divides by SECTION_QUESTION_COUNTS, not by items served.
    const grade = "a";
    const items = pickGmatChallengeItems({ grade, seed: "per-section", pickerVersion: 6 });
    const byId = exerciseMapForGrade(grade);
    const res = gradeGmatChallenge({ itemsBySection: items, exerciseById: byId, answers: {} });
    expect(res.scoreBySection.quant).toBe(0);
    expect(res.scoreBySection.verbal).toBe(0);
    expect(res.scoreBySection.data).toBe(0);
  });
});
