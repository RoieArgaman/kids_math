import { describe, expect, it } from "vitest";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import type { DayId, DayProgressState } from "@/lib/types";

const LEGACY_KEY = "kids_math.workbook_progress.v1";
const GRADE_A_KEY = "kids_math.workbook_progress.v2.grade.a";
const GRADE_A_KEY_V1_STALE = "kids_math.workbook_progress.v1.grade.a";
const GRADE_B_KEY = "kids_math.workbook_progress.v2.grade.b";
const GRADE_B_KEY_V1_STALE = "kids_math.workbook_progress.v1.grade.b";

function makeDay(dayId: DayId): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    wrongBySection: {},
    attempts: [],
    percentDone: 0,
    isComplete: false,
  };
}

describe("loadProgressState", () => {
  it("discards grade A v1 localStorage when v2 is empty (exercise/day ids no longer match)", () => {
    const stale = {
      version: 1,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(GRADE_A_KEY_V1_STALE, JSON.stringify(stale));
    const loaded = loadProgressState({ grade: "a" });
    expect(Object.keys(loaded.days)).toHaveLength(0);
    expect(window.localStorage.getItem(GRADE_A_KEY_V1_STALE)).toBeNull();
  });

  it("migrates legacy storage to grade A when the per-grade key is empty", () => {
    const legacy = {
      version: 1,
      days: {
        "day-1": makeDay("day-1"),
      },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.version).toBe(1);
    expect(loaded.days["day-1"]?.dayId).toBe("day-1");
    expect(window.localStorage.getItem(GRADE_A_KEY)).toBeTruthy();
  });

  it("does not migrate legacy when grade A key already has data (prefers new key)", () => {
    const legacy = {
      version: 1,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    const newer = {
      version: 1,
      days: { "day-2": makeDay("day-2") },
      updatedAt: "2021-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
    window.localStorage.setItem(GRADE_A_KEY, JSON.stringify(newer));

    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-2"]?.dayId).toBe("day-2");
    expect(loaded.days["day-1"]).toBeUndefined();
  });

  it("does not read legacy storage for non–grade-A", () => {
    const legacy = {
      version: 1,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));

    const loaded = loadProgressState({ grade: "b" });
    expect(Object.keys(loaded.days)).toHaveLength(0);
  });

  it("migrates grade B v1 per-grade storage to v2 when v2 is empty", () => {
    const stale = {
      version: 1,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(GRADE_B_KEY_V1_STALE, JSON.stringify(stale));
    const loaded = loadProgressState({ grade: "b" });
    expect(loaded.days["day-1"]?.dayId).toBe("day-1");
    expect(window.localStorage.getItem(GRADE_B_KEY)).toBeTruthy();
    expect(window.localStorage.getItem(GRADE_B_KEY_V1_STALE)).toBeNull();
  });

  it("does not overwrite grade B v2 when migrating from v1", () => {
    const stale = {
      version: 1,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    const newer = {
      version: 1,
      days: { "day-2": makeDay("day-2") },
      updatedAt: "2021-01-01T00:00:00.000Z",
    };
    window.localStorage.setItem(GRADE_B_KEY_V1_STALE, JSON.stringify(stale));
    window.localStorage.setItem(GRADE_B_KEY, JSON.stringify(newer));

    const loaded = loadProgressState({ grade: "b" });
    expect(loaded.days["day-2"]?.dayId).toBe("day-2");
    expect(loaded.days["day-1"]).toBeUndefined();
  });

  it("returns initial state when JSON is corrupt", () => {
    window.localStorage.setItem(GRADE_A_KEY, "{not json");
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days).toEqual({});
  });

  it("sanitize drops entries with wrong version", () => {
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 2,
        days: { "day-1": makeDay("day-1") },
        updatedAt: "2020-01-01T00:00:00.000Z",
      }),
    );
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days).toEqual({});
  });

  it("sanitize drops day entries when stored dayId does not match the key", () => {
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 1,
        days: {
          "day-1": makeDay("day-2"),
        },
        updatedAt: "2020-01-01T00:00:00.000Z",
      }),
    );
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-1"]).toBeUndefined();
    expect(Object.keys(loaded.days)).toHaveLength(0);
  });

  it("sanitize defaults wrongCount to 0 when missing", () => {
    const partial = {
      dayId: "day-1" as DayId,
      answers: {},
      correctAnswers: {},
      attempts: [],
      percentDone: 0,
      isComplete: false,
    };
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 1,
        days: { "day-1": partial },
        updatedAt: "2020-01-01T00:00:00.000Z",
      }),
    );
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-1"]?.wrongCount).toBe(0);
  });

  it("sanitize defaults wrongBySection to {} when missing", () => {
    const partial = {
      dayId: "day-1" as DayId,
      answers: {},
      correctAnswers: {},
      wrongCount: 0,
      attempts: [],
      percentDone: 0,
      isComplete: false,
    };
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 1,
        days: { "day-1": partial },
        updatedAt: "2020-01-01T00:00:00.000Z",
      }),
    );
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-1"]?.wrongBySection).toEqual({});
  });

  it("sanitize drops invalid day shapes", () => {
    window.localStorage.setItem(
      GRADE_A_KEY,
      JSON.stringify({
        version: 1,
        days: {
          "day-1": { dayId: "day-1" },
        },
        updatedAt: "2020-01-01T00:00:00.000Z",
      }),
    );
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-1"]).toBeUndefined();
  });
});

describe("saveProgressState", () => {
  it("persists sanitized version and updatedAt", () => {
    const state = {
      version: 1 as const,
      days: {
        "day-1": makeDay("day-1"),
      },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    saveProgressState(state, { grade: "a" });
    const raw = window.localStorage.getItem(GRADE_A_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { version: number; updatedAt: string };
    expect(parsed.version).toBe(1);
    expect(parsed.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
  });


  it("round-trips bestTimeMs on a day", () => {
    const day = makeDay("day-1");
    const withBest: typeof day = { ...day, bestTimeMs: 90_000 };
    const state = {
      version: 1 as const,
      days: { "day-1": withBest },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    saveProgressState(state, { grade: "a" });
    const loaded = loadProgressState({ grade: "a" });
    expect(loaded.days["day-1"]?.bestTimeMs).toBe(90_000);
  });

  it("persists grade B to v2 key", () => {
    const state = {
      version: 1 as const,
      days: { "day-1": makeDay("day-1") },
      updatedAt: "2020-01-01T00:00:00.000Z",
    };
    saveProgressState(state, { grade: "b" });
    expect(window.localStorage.getItem(GRADE_B_KEY)).toBeTruthy();
  });
});
