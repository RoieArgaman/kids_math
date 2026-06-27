import { afterEach, describe, expect, it } from "vitest";
import {
  clearScienceProgressState,
  scienceProgressStorageKey,
  loadScienceProgressState,
  saveScienceProgressState,
} from "@/lib/science/storage";
import { workbookProgressStorageKey } from "@/lib/progress/storage";
import { englishProgressStorageKey } from "@/lib/english/storage";
import type { DayId, DayProgressState, WorkbookProgressState } from "@/lib/types";

const SCIENCE_KEY = "kids_math.science.workbook_progress.v1";

function makeDay(dayId: DayId): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    wrongBySection: {},
    attempts: [],
    percentDone: 100,
    isComplete: true,
  };
}

function makeState(dayId: DayId): WorkbookProgressState {
  return {
    version: 1,
    days: { [dayId]: makeDay(dayId) },
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

afterEach(() => {
  window.localStorage.clear();
});

describe("science progress storage", () => {
  it("uses an isolated, subject-namespaced key", () => {
    expect(scienceProgressStorageKey()).toBe(SCIENCE_KEY);
  });

  it("key is distinct from the math and english stores", () => {
    expect(scienceProgressStorageKey()).not.toBe(workbookProgressStorageKey("a"));
    expect(scienceProgressStorageKey()).not.toBe(workbookProgressStorageKey("b"));
    expect(scienceProgressStorageKey()).not.toBe(englishProgressStorageKey());
  });

  it("returns an empty initial state when nothing is stored", () => {
    const state = loadScienceProgressState();
    expect(Object.keys(state.days)).toHaveLength(0);
  });

  it("round-trips saved Science progress", () => {
    saveScienceProgressState(makeState("day-1"));
    const loaded = loadScienceProgressState();
    expect(loaded.days["day-1"]?.isComplete).toBe(true);
  });

  it("never touches the math or english workbook keys", () => {
    saveScienceProgressState(makeState("day-1"));
    expect(window.localStorage.getItem(workbookProgressStorageKey("a"))).toBeNull();
    expect(window.localStorage.getItem(workbookProgressStorageKey("b"))).toBeNull();
    expect(window.localStorage.getItem(englishProgressStorageKey())).toBeNull();
  });

  it("fails safe to initial state on corrupt data", () => {
    window.localStorage.setItem(SCIENCE_KEY, "{not json");
    const state = loadScienceProgressState();
    expect(Object.keys(state.days)).toHaveLength(0);
  });

  it("clears only the Science key", () => {
    saveScienceProgressState(makeState("day-1"));
    clearScienceProgressState();
    expect(window.localStorage.getItem(SCIENCE_KEY)).toBeNull();
  });
});
