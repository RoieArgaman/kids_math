import { afterEach, describe, expect, it } from "vitest";
import type { ExerciseId } from "@/lib/types";
import {
  clearScienceFinalExamState,
  createInitialScienceFinalExamState,
  loadScienceFinalExamState,
  saveScienceFinalExamState,
  scienceFinalExamStorageKey,
} from "@/lib/science/final-exam/storage";

const ids = (n: number): ExerciseId[] =>
  Array.from({ length: n }, (_, i) => `sci-exam-ex-${i + 1}` as ExerciseId);

afterEach(() => {
  window.localStorage.clear();
});

describe("science final-exam storage", () => {
  it("keys are level-scoped and distinct per level", () => {
    expect(scienceFinalExamStorageKey("a")).not.toBe(scienceFinalExamStorageKey("b"));
    // default level is A
    expect(scienceFinalExamStorageKey()).toBe(scienceFinalExamStorageKey("a"));
  });

  it("returns null when nothing is stored", () => {
    expect(loadScienceFinalExamState("a")).toBeNull();
  });

  it("round-trips a saved exam state", () => {
    const state = createInitialScienceFinalExamState({ selectedExerciseIds: ids(3) });
    state.answers = { [ids(1)[0]]: "4" } as Record<ExerciseId, string>;
    state.correctMap = { [ids(1)[0]]: true } as Record<ExerciseId, boolean>;
    state.submittedAt = "2026-06-01T00:00:00.000Z";
    state.scorePercent = 80;
    state.passed = true;
    saveScienceFinalExamState(state, "a");

    const loaded = loadScienceFinalExamState("a");
    expect(loaded?.selectedExerciseIds).toHaveLength(3);
    expect(loaded?.scorePercent).toBe(80);
    expect(loaded?.passed).toBe(true);
  });

  it("keeps level A and level B exams isolated", () => {
    saveScienceFinalExamState(createInitialScienceFinalExamState({ selectedExerciseIds: ids(2) }), "a");
    expect(loadScienceFinalExamState("b")).toBeNull();
  });

  it("fails safe to null on corrupt JSON", () => {
    window.localStorage.setItem(scienceFinalExamStorageKey("a"), "{not json");
    expect(loadScienceFinalExamState("a")).toBeNull();
  });

  it("rejects a state with no selected exercises", () => {
    window.localStorage.setItem(
      scienceFinalExamStorageKey("a"),
      JSON.stringify(createInitialScienceFinalExamState({ selectedExerciseIds: [] })),
    );
    expect(loadScienceFinalExamState("a")).toBeNull();
  });

  it("clears only the requested level", () => {
    saveScienceFinalExamState(createInitialScienceFinalExamState({ selectedExerciseIds: ids(2) }), "a");
    saveScienceFinalExamState(createInitialScienceFinalExamState({ selectedExerciseIds: ids(2) }), "b");
    clearScienceFinalExamState("a");
    expect(loadScienceFinalExamState("a")).toBeNull();
    expect(loadScienceFinalExamState("b")).not.toBeNull();
  });

  it("stamps updatedAt on save and preserves it on load", () => {
    const state = createInitialScienceFinalExamState({ selectedExerciseIds: ids(3) });
    expect(state.updatedAt).toBeUndefined();
    saveScienceFinalExamState(state, "a");
    expect(loadScienceFinalExamState("a")?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("loads legacy state without updatedAt (backward compat)", () => {
    const legacy = createInitialScienceFinalExamState({ selectedExerciseIds: ids(3) });
    window.localStorage.setItem(scienceFinalExamStorageKey("a"), JSON.stringify(legacy));
    const loaded = loadScienceFinalExamState("a");
    expect(loaded).not.toBeNull();
    expect(loaded?.updatedAt).toBeUndefined();
  });
});
