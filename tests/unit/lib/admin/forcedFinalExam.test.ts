import { describe, expect, it } from "vitest";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { buildAdminForcedPassedFinalExamState } from "@/lib/admin/forcedFinalExam";

describe("buildAdminForcedPassedFinalExamState", () => {
  it("produces a passed exam with full correctMap and 100% score (grade a)", () => {
    const state = buildAdminForcedPassedFinalExamState({
      grade: "a",
      seed: "unit-admin-force-a",
      submittedAtIso: "2026-01-15T12:00:00.000Z",
    });

    expect(state.version).toBe(1);
    expect(state.grade).toBe("a");
    expect(state.passed).toBe(true);
    expect(state.scorePercent).toBe(100);
    expect(state.submittedAt).toBe("2026-01-15T12:00:00.000Z");
    expect(state.selectedExerciseIds).toHaveLength(FINAL_EXAM_QUESTION_COUNT);
    expect(Object.keys(state.correctMap)).toHaveLength(FINAL_EXAM_QUESTION_COUNT);
    for (const id of state.selectedExerciseIds) {
      expect(state.correctMap[id]).toBe(true);
    }
  });

  it("produces consistent shape for grade b", () => {
    const state = buildAdminForcedPassedFinalExamState({
      grade: "b",
      seed: "unit-admin-force-b",
      submittedAtIso: "2026-03-01T08:00:00.000Z",
    });
    expect(state.grade).toBe("b");
    expect(state.passed).toBe(true);
    expect(Object.keys(state.correctMap)).toHaveLength(FINAL_EXAM_QUESTION_COUNT);
  });
});
