import { afterEach, describe, expect, it } from "vitest";
import type { ExerciseId } from "@/lib/types";
import {
  clearEnglishFinalExamState,
  createInitialEnglishFinalExamState,
  englishFinalExamStorageKey,
  loadEnglishFinalExamState,
  saveEnglishFinalExamState,
} from "@/lib/english/final-exam/storage";

const LEGACY_KEY = "kids_math.english.final_exam.v1";

const ids = (n: number): ExerciseId[] =>
  Array.from({ length: n }, (_, i) => `en-exam-ex-${i + 1}` as ExerciseId);

afterEach(() => {
  window.localStorage.clear();
});

describe("english final-exam storage", () => {
  it("returns null when nothing is stored", () => {
    expect(loadEnglishFinalExamState("a")).toBeNull();
  });

  it("round-trips a saved exam state", () => {
    const state = createInitialEnglishFinalExamState({ selectedExerciseIds: ids(3) });
    state.scorePercent = 90;
    state.passed = true;
    saveEnglishFinalExamState(state, "a");

    const loaded = loadEnglishFinalExamState("a");
    expect(loaded?.selectedExerciseIds).toHaveLength(3);
    expect(loaded?.scorePercent).toBe(90);
  });

  it("migrates a legacy single-key exam into Level A on first load", () => {
    // Pre-level data lived at the bare key with no ".level.a" suffix.
    const legacy = createInitialEnglishFinalExamState({ selectedExerciseIds: ids(2) });
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const loaded = loadEnglishFinalExamState("a");
    expect(loaded?.selectedExerciseIds).toHaveLength(2);
    // Legacy key is consumed and the value now lives under the level-A key.
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(window.localStorage.getItem(englishFinalExamStorageKey("a"))).not.toBeNull();
  });

  it("does not clobber existing Level A data with the legacy key", () => {
    saveEnglishFinalExamState(createInitialEnglishFinalExamState({ selectedExerciseIds: ids(5) }), "a");
    window.localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify(createInitialEnglishFinalExamState({ selectedExerciseIds: ids(1) })),
    );
    // Existing level-A value wins; migration only runs when level A is empty.
    expect(loadEnglishFinalExamState("a")?.selectedExerciseIds).toHaveLength(5);
  });

  it("fails safe to null on corrupt JSON", () => {
    window.localStorage.setItem(englishFinalExamStorageKey("a"), "{not json");
    expect(loadEnglishFinalExamState("a")).toBeNull();
  });

  it("clears only the requested level", () => {
    saveEnglishFinalExamState(createInitialEnglishFinalExamState({ selectedExerciseIds: ids(2) }), "a");
    saveEnglishFinalExamState(createInitialEnglishFinalExamState({ selectedExerciseIds: ids(2) }), "b");
    clearEnglishFinalExamState("a");
    expect(loadEnglishFinalExamState("a")).toBeNull();
    expect(loadEnglishFinalExamState("b")).not.toBeNull();
  });

  it("stamps updatedAt on save and preserves it on load", () => {
    const state = createInitialEnglishFinalExamState({ selectedExerciseIds: ids(3) });
    expect(state.updatedAt).toBeUndefined();
    saveEnglishFinalExamState(state, "a");
    expect(loadEnglishFinalExamState("a")?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("loads legacy state without updatedAt (backward compat)", () => {
    const legacy = createInitialEnglishFinalExamState({ selectedExerciseIds: ids(3) });
    window.localStorage.setItem(englishFinalExamStorageKey("a"), JSON.stringify(legacy));
    const loaded = loadEnglishFinalExamState("a");
    expect(loaded).not.toBeNull();
    expect(loaded?.updatedAt).toBeUndefined();
  });
});
