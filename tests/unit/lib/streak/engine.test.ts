import { describe, expect, it } from "vitest";
import type { StreakState } from "@/lib/streak/types";
import { computeNextStreakState, getTodayDate } from "@/lib/streak/engine";

function makeState(overrides: Partial<StreakState> = {}): StreakState {
  return {
    version: 1,
    lastActiveDate: "2024-01-01",
    currentStreak: 1,
    longestStreak: 1,
    earnedBadges: [],
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getTodayDate", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    const today = getTodayDate();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the local date components", () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    expect(getTodayDate()).toBe(expected);
  });
});

describe("computeNextStreakState — first-ever visit", () => {
  it("initializes streak=1, longest=1 with no badges", () => {
    const { nextState, newlyEarnedBadges } = computeNextStreakState(null, "2024-03-10");
    expect(nextState.currentStreak).toBe(1);
    expect(nextState.longestStreak).toBe(1);
    expect(nextState.lastActiveDate).toBe("2024-03-10");
    expect(nextState.version).toBe(1);
    expect(nextState.earnedBadges).toEqual([]);
    expect(newlyEarnedBadges).toEqual([]);
    expect(typeof nextState.updatedAt).toBe("string");
  });
});

describe("computeNextStreakState — same-day revisit", () => {
  it("returns the exact same state reference with no new badges", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 4, longestStreak: 9 });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-10");
    expect(nextState).toBe(current); // identity (===), important for HomeScreen
    expect(newlyEarnedBadges).toEqual([]);
  });
});

describe("computeNextStreakState — consecutive day (diff = 1)", () => {
  it("increments currentStreak and grows longestStreak", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 4, longestStreak: 4 });
    const { nextState } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(5);
    expect(nextState.longestStreak).toBe(5);
    expect(nextState.lastActiveDate).toBe("2024-03-11");
  });

  it("keeps a larger previous longestStreak when the current streak is still below it", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 4, longestStreak: 12 });
    const { nextState } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(5);
    expect(nextState.longestStreak).toBe(12);
  });
});

describe("computeNextStreakState — gap > 1 day (reset)", () => {
  it("resets currentStreak to 1 when the gap is 2 days", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 6, longestStreak: 6 });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-12");
    expect(nextState.currentStreak).toBe(1);
    expect(newlyEarnedBadges).toEqual([]);
  });

  it("resets to 1 across a large gap and retains longestStreak", () => {
    const current = makeState({ lastActiveDate: "2024-03-01", currentStreak: 6, longestStreak: 20 });
    const { nextState } = computeNextStreakState(current, "2024-04-01");
    expect(nextState.currentStreak).toBe(1);
    expect(nextState.longestStreak).toBe(20); // max(20, 1) === 20 after reset
  });
});

describe("computeNextStreakState — milestones", () => {
  it("earns streak_3 when reaching 3 consecutive days", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 2, longestStreak: 2 });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(3);
    expect(newlyEarnedBadges).toEqual(["streak_3"]);
    expect(nextState.earnedBadges).toEqual(["streak_3"]);
  });

  it("earns streak_7 when reaching 7 consecutive days", () => {
    const current = makeState({
      lastActiveDate: "2024-03-10",
      currentStreak: 6,
      longestStreak: 6,
      earnedBadges: ["streak_3"],
    });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(7);
    expect(newlyEarnedBadges).toEqual(["streak_7"]);
    expect(nextState.earnedBadges).toEqual(["streak_3", "streak_7"]);
  });

  it("earns streak_30 when reaching 30 consecutive days", () => {
    const current = makeState({
      lastActiveDate: "2024-03-10",
      currentStreak: 29,
      longestStreak: 29,
      earnedBadges: ["streak_3", "streak_7"],
    });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(30);
    expect(newlyEarnedBadges).toEqual(["streak_30"]);
    expect(nextState.earnedBadges).toEqual(["streak_3", "streak_7", "streak_30"]);
  });

  it("does not earn a milestone one short of the threshold", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 1, longestStreak: 1 });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(2);
    expect(newlyEarnedBadges).toEqual([]);
  });
});

describe("computeNextStreakState — no double-award", () => {
  it("does not re-emit a milestone already in earnedBadges", () => {
    const current = makeState({
      lastActiveDate: "2024-03-10",
      currentStreak: 3,
      longestStreak: 3,
      earnedBadges: ["streak_3"],
    });
    const { nextState, newlyEarnedBadges } = computeNextStreakState(current, "2024-03-11");
    expect(nextState.currentStreak).toBe(4);
    expect(newlyEarnedBadges).toEqual([]); // streak_3 already owned
    expect(nextState.earnedBadges).toEqual(["streak_3"]); // unchanged
  });
});

describe("computeNextStreakState — longestStreak after reset", () => {
  it("longestStreak = max(previous, newStreak) even when streak resets to 1", () => {
    const current = makeState({ lastActiveDate: "2024-03-10", currentStreak: 10, longestStreak: 10 });
    const { nextState } = computeNextStreakState(current, "2024-03-20"); // gap > 1
    expect(nextState.currentStreak).toBe(1);
    expect(nextState.longestStreak).toBe(10);
  });
});
