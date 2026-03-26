import { describe, expect, it, vi } from "vitest";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { createInitialFinalExamState, loadFinalExamState, saveFinalExamState } from "@/lib/final-exam/storage";
import { pickFinalExamExerciseIds } from "@/lib/final-exam/picker";
import type { FinalExamState } from "@/lib/final-exam/types";

describe("final-exam storage", () => {
  it("save/load round-trip preserves core fields", () => {
    const selectedExerciseIds = pickFinalExamExerciseIds({
      grade: "a",
      seed: "round-trip",
      pickerVersion: 1,
    });
    expect(selectedExerciseIds).toHaveLength(FINAL_EXAM_QUESTION_COUNT);

    const initial = createInitialFinalExamState({ grade: "a", selectedExerciseIds });
    const enriched: FinalExamState = {
      ...initial,
      answers: { [selectedExerciseIds[0]!]: "42" },
      correctMap: { [selectedExerciseIds[0]!]: true },
      attempts: { [selectedExerciseIds[0]!]: 1 },
    };

    saveFinalExamState("a", enriched);
    const loaded = loadFinalExamState("a");

    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(1);
    expect(loaded!.grade).toBe("a");
    expect(loaded!.pickerVersion).toBe(1);
    expect(loaded!.selectedExerciseIds).toEqual(selectedExerciseIds);
    expect(loaded!.answers[selectedExerciseIds[0]!]).toBe("42");
    expect(loaded!.correctMap[selectedExerciseIds[0]!]).toBe(true);
    expect(loaded!.attempts[selectedExerciseIds[0]!]).toBe(1);
  });

  it("rejects stored state when version is not 1", () => {
    const selectedExerciseIds = pickFinalExamExerciseIds({
      grade: "a",
      seed: "v",
      pickerVersion: 1,
    });
    const raw = JSON.stringify({
      ...createInitialFinalExamState({ grade: "a", selectedExerciseIds }),
      version: 2,
    });
    window.localStorage.setItem("kids_math.final_exam.v1.grade.a", raw);
    expect(loadFinalExamState("a")).toBeNull();
  });

  it("rejects stored state when pickerVersion is not 1", () => {
    const selectedExerciseIds = pickFinalExamExerciseIds({
      grade: "a",
      seed: "pv",
      pickerVersion: 1,
    });
    const raw = JSON.stringify({
      ...createInitialFinalExamState({ grade: "a", selectedExerciseIds }),
      pickerVersion: 2,
    });
    window.localStorage.setItem("kids_math.final_exam.v1.grade.a", raw);
    expect(loadFinalExamState("a")).toBeNull();
  });

  it("rejects stored state when selectedExerciseIds length does not match FINAL_EXAM_QUESTION_COUNT", () => {
    const selectedExerciseIds = pickFinalExamExerciseIds({
      grade: "a",
      seed: "cnt",
      pickerVersion: 1,
    }).slice(0, FINAL_EXAM_QUESTION_COUNT - 1);

    const raw = JSON.stringify(createInitialFinalExamState({ grade: "a", selectedExerciseIds }));
    window.localStorage.setItem("kids_math.final_exam.v1.grade.a", raw);
    expect(loadFinalExamState("a")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    window.localStorage.setItem("kids_math.final_exam.v1.grade.a", "{");
    expect(loadFinalExamState("a")).toBeNull();
  });

  it("does not throw when localStorage.setItem fails (quota/private mode)", () => {
    const selectedExerciseIds = pickFinalExamExerciseIds({
      grade: "a",
      seed: "quota-probe",
      pickerVersion: 1,
    });
    const initial: FinalExamState = createInitialFinalExamState({ grade: "a", selectedExerciseIds });

    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveFinalExamState("a", initial)).not.toThrow();

    spy.mockRestore();
  });
});
