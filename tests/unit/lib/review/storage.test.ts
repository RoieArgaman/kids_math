import { describe, expect, it } from "vitest";
import type { ExerciseId } from "@/lib/types";
import {
  clearReviewState,
  createInitialReviewState,
  englishReviewStorageKey,
  loadReviewState,
  reviewStorageKey,
  sanitizeReviewState,
  saveReviewState,
} from "@/lib/review/storage";
import { REVIEW_STORAGE_SCHEMA_VERSION } from "@/lib/review/types";
import type { ReviewItemState, ReviewState } from "@/lib/review/types";

const GRADE_A_KEY = "kids_math.review.v1.grade.a";
const ENGLISH_KEY = "kids_math.english.review.v1";
const EX: ExerciseId = "day-1-section-1-exercise-1";

function item(exerciseId: ExerciseId = EX): ReviewItemState {
  return {
    exerciseId,
    box: 2,
    dueAt: "2024-01-12T00:00:00.000Z",
    lastReviewedAt: "2024-01-10T00:00:00.000Z",
    timesSeen: 3,
    timesCorrect: 1,
  };
}

function stateWith(...items: ReviewItemState[]): ReviewState {
  const base = createInitialReviewState("2024-01-10T00:00:00.000Z");
  const map: Record<ExerciseId, ReviewItemState> = {};
  for (const it of items) map[it.exerciseId] = it;
  return { ...base, items: map };
}

describe("key formats", () => {
  it("uses kids_math.review.v1.grade.<grade> for math grades", () => {
    expect(reviewStorageKey("a")).toBe(GRADE_A_KEY);
    expect(reviewStorageKey("b")).toBe("kids_math.review.v1.grade.b");
  });

  it("uses a single key for the english track", () => {
    expect(englishReviewStorageKey()).toBe(ENGLISH_KEY);
  });
});

describe("saveReviewState / loadReviewState round-trip", () => {
  it("round-trips state through localStorage for a math grade", () => {
    const state = stateWith(item());
    saveReviewState(state, { grade: "a" });

    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeTruthy();
    const loaded = loadReviewState({ grade: "a" });
    expect(loaded.version).toBe(REVIEW_STORAGE_SCHEMA_VERSION);
    expect(loaded.items[EX]).toEqual(item());
  });

  it("defaults to grade A when no grade is provided", () => {
    saveReviewState(stateWith(item()), {});
    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeTruthy();
  });

  it("routes subject:english to the english key, not a grade key", () => {
    saveReviewState(stateWith(item()), { subject: "english" });
    expect(window.localStorage.getItem(ENGLISH_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeNull();

    const loaded = loadReviewState({ subject: "english" });
    expect(loaded.items[EX]).toEqual(item());
  });

  it("isolates english and math stores from each other", () => {
    saveReviewState(stateWith(item("day-1-section-1-exercise-1")), { grade: "a" });
    saveReviewState(stateWith(item("day-2-section-1-exercise-1")), { subject: "english" });

    expect(Object.keys(loadReviewState({ grade: "a" }).items)).toEqual([
      "day-1-section-1-exercise-1",
    ]);
    expect(Object.keys(loadReviewState({ subject: "english" }).items)).toEqual([
      "day-2-section-1-exercise-1",
    ]);
  });

  it("returns an empty initial state when nothing is stored", () => {
    const loaded = loadReviewState({ grade: "a" });
    expect(loaded.version).toBe(REVIEW_STORAGE_SCHEMA_VERSION);
    expect(loaded.items).toEqual({});
  });
});

describe("clearReviewState", () => {
  it("removes the stored state for the given track", () => {
    saveReviewState(stateWith(item()), { grade: "a" });
    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeTruthy();
    clearReviewState({ grade: "a" });
    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeNull();
  });
});

describe("sanitizeReviewState", () => {
  it("rejects a wrong schema version → empty initial state", () => {
    const result = sanitizeReviewState({
      version: 2,
      items: { [EX]: item() },
      updatedAt: "2024-01-10T00:00:00.000Z",
    });
    expect(result.version).toBe(REVIEW_STORAGE_SCHEMA_VERSION);
    expect(result.items).toEqual({});
  });

  it("returns empty initial state for non-objects", () => {
    expect(sanitizeReviewState(null).items).toEqual({});
    expect(sanitizeReviewState("nope").items).toEqual({});
    expect(sanitizeReviewState(42).items).toEqual({});
  });

  it("drops malformed items but keeps valid ones", () => {
    const result = sanitizeReviewState({
      version: REVIEW_STORAGE_SCHEMA_VERSION,
      items: {
        [EX]: item(EX),
        "bad-box": { ...item("bad-box"), box: 9 },
        "missing-due": {
          exerciseId: "missing-due",
          box: 2,
          lastReviewedAt: "2024-01-10T00:00:00.000Z",
          timesSeen: 1,
          timesCorrect: 0,
        },
        "not-an-object": 7,
      },
      updatedAt: "2024-01-10T00:00:00.000Z",
    });
    expect(Object.keys(result.items)).toEqual([EX]);
    expect(result.items[EX]).toEqual(item(EX));
  });

  it("drops items whose map key does not match the stored exerciseId", () => {
    const result = sanitizeReviewState({
      version: REVIEW_STORAGE_SCHEMA_VERSION,
      items: { "key-a": item("key-b") },
      updatedAt: "2024-01-10T00:00:00.000Z",
    });
    expect(result.items).toEqual({});
  });

  it("defaults missing numeric fields to 0", () => {
    const result = sanitizeReviewState({
      version: REVIEW_STORAGE_SCHEMA_VERSION,
      items: {
        [EX]: {
          exerciseId: EX,
          box: 1,
          dueAt: "2024-01-12T00:00:00.000Z",
          lastReviewedAt: "2024-01-10T00:00:00.000Z",
        },
      },
      updatedAt: "2024-01-10T00:00:00.000Z",
    });
    expect(result.items[EX]?.timesSeen).toBe(0);
    expect(result.items[EX]?.timesCorrect).toBe(0);
  });
});

describe("loadReviewState resilience", () => {
  it("returns initial state when the stored JSON is corrupt", () => {
    window.localStorage.setItem(GRADE_A_KEY, "{not json");
    const loaded = loadReviewState({ grade: "a" });
    expect(loaded.items).toEqual({});
    expect(loaded.version).toBe(REVIEW_STORAGE_SCHEMA_VERSION);
  });

  it("returns initial state when the stored version is wrong", () => {
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 99,
        items: { [EX]: item() },
        updatedAt: "2024-01-10T00:00:00.000Z",
      }),
    );
    expect(loadReviewState({ grade: "a" }).items).toEqual({});
  });
});
