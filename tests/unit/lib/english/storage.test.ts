import { afterEach, describe, expect, it } from "vitest";
import {
  clearEnglishProgressState,
  englishProgressStorageKey,
  loadEnglishProgressState,
  saveEnglishProgressState,
} from "@/lib/english/storage";
import { workbookProgressStorageKey } from "@/lib/progress/storage";
import type { DayId, DayProgressState, WorkbookProgressState } from "@/lib/types";

const ENGLISH_KEY = "kids_math.english.workbook_progress.v1";

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

describe("english progress storage", () => {
  it("uses an isolated, subject-namespaced key (no grade axis)", () => {
    expect(englishProgressStorageKey()).toBe(ENGLISH_KEY);
  });

  it("returns an empty initial state when nothing is stored", () => {
    const state = loadEnglishProgressState();
    expect(Object.keys(state.days)).toHaveLength(0);
  });

  it("round-trips saved English progress", () => {
    saveEnglishProgressState(makeState("day-1"));
    const loaded = loadEnglishProgressState();
    expect(loaded.days["day-1"]?.isComplete).toBe(true);
  });

  it("never touches the math workbook keys", () => {
    saveEnglishProgressState(makeState("day-1"));
    expect(window.localStorage.getItem(workbookProgressStorageKey("a"))).toBeNull();
    expect(window.localStorage.getItem(workbookProgressStorageKey("b"))).toBeNull();
  });

  it("fails safe to initial state on corrupt data", () => {
    window.localStorage.setItem(ENGLISH_KEY, "{not json");
    const state = loadEnglishProgressState();
    expect(Object.keys(state.days)).toHaveLength(0);
  });

  it("clears only the English key", () => {
    saveEnglishProgressState(makeState("day-1"));
    clearEnglishProgressState();
    expect(window.localStorage.getItem(ENGLISH_KEY)).toBeNull();
  });
});
