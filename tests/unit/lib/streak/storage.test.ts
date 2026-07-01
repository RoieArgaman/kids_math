import { afterEach, describe, expect, it } from "vitest";
import { clearStreakState, loadStreakState, saveStreakState } from "@/lib/streak/storage";
import type { StreakState } from "@/lib/streak/types";

const STORAGE_KEY = "kids_math.streak.v1";

function makeState(overrides: Partial<StreakState> = {}): StreakState {
  return {
    version: 1,
    lastActiveDate: "2026-06-01",
    currentStreak: 3,
    longestStreak: 7,
    earnedBadges: ["streak_3"],
    updatedAt: "2026-06-01T08:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  window.localStorage.clear();
});

describe("streak storage backward-compat / round-trip", () => {
  it("returns null when nothing is stored", () => {
    expect(loadStreakState()).toBeNull();
  });

  it("round-trips a saved streak state", () => {
    saveStreakState(makeState());
    const loaded = loadStreakState();
    expect(loaded).toMatchObject({
      version: 1,
      lastActiveDate: "2026-06-01",
      currentStreak: 3,
      longestStreak: 7,
      earnedBadges: ["streak_3"],
    });
  });

  it("fails safe to null on corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadStreakState()).toBeNull();
  });

  it("rejects a payload from a future/unknown schema version", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeState({ version: 2 as unknown as 1 })));
    expect(loadStreakState()).toBeNull();
  });

  it("rejects negative or non-integer streak counts", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeState({ currentStreak: -1 })));
    expect(loadStreakState()).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeState({ longestStreak: 2.5 })));
    expect(loadStreakState()).toBeNull();
  });

  it("rejects a missing lastActiveDate", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeState({ lastActiveDate: "" })));
    expect(loadStreakState()).toBeNull();
  });

  it("drops unknown badge ids but keeps recognized milestones", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(makeState({ earnedBadges: ["streak_3", "totally-made-up", "streak_30"] })),
    );
    expect(loadStreakState()?.earnedBadges).toEqual(["streak_3", "streak_30"]);
  });

  it("clears only the streak key", () => {
    saveStreakState(makeState());
    clearStreakState();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadStreakState()).toBeNull();
  });
});
