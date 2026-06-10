/**
 * Backward-compatibility tests for auth storage changes.
 *
 * Verifies that adding scheduleSync() to all 5 storage save functions
 * does NOT change the localStorage write behavior for unauthenticated users.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock serverSync so scheduleSync() is a tracked spy — never fires for real
vi.mock("@/lib/auth/serverSync", () => ({
  scheduleSync: vi.fn(),
  registerSyncCallback: vi.fn(),
  unregisterSyncCallback: vi.fn(),
}));

import { scheduleSync } from "@/lib/auth/serverSync";
import { saveProgressState, loadProgressState } from "@/lib/progress/storage";
import { saveBadgeState, loadBadgeState, createInitialBadgeState } from "@/lib/badges/storage";
import { saveStreakState, loadStreakState } from "@/lib/streak/storage";
import { saveFinalExamState, loadFinalExamState } from "@/lib/final-exam/storage";
import { saveGmatChallengeState, loadGmatChallengeState, createInitialRulesState } from "@/lib/gmat-challenge/storage";
import type { WorkbookProgressState, DayId } from "@/lib/types";
import type { StreakState } from "@/lib/streak/types";
import type { FinalExamState } from "@/lib/final-exam/types";

const scheduleSyncMock = vi.mocked(scheduleSync);

function makeProgressState(): WorkbookProgressState {
  return {
    version: 1,
    days: {
      "day-1": {
        dayId: "day-1" as DayId,
        answers: {},
        correctAnswers: {},
        wrongCount: 0,
        wrongBySection: {},
        attempts: [],
        percentDone: 50,
        isComplete: false,
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

function makeStreakState(): StreakState {
  return {
    version: 1,
    lastActiveDate: "2024-01-01",
    currentStreak: 3,
    longestStreak: 5,
    earnedBadges: [],
    updatedAt: new Date().toISOString(),
  };
}

describe("storage backward compatibility — scheduleSync added but localStorage behavior unchanged", () => {
  beforeEach(() => {
    scheduleSyncMock.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("saveProgressState", () => {
    it("still writes data to localStorage", () => {
      const state = makeProgressState();
      saveProgressState(state, { grade: "a" });
      const raw = localStorage.getItem("kids_math.workbook_progress.v2.grade.a");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as WorkbookProgressState;
      expect(parsed.days["day-1"]?.dayId).toBe("day-1");
    });

    it("calls scheduleSync once per save", () => {
      saveProgressState(makeProgressState(), { grade: "a" });
      expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    });

    it("data round-trips correctly (load ← save)", () => {
      const state = makeProgressState();
      saveProgressState(state, { grade: "a" });
      const loaded = loadProgressState({ grade: "a" });
      expect(loaded.days["day-1"]?.percentDone).toBe(50);
    });

    it("write for grade B does not touch grade A key", () => {
      saveProgressState(makeProgressState(), { grade: "b" });
      expect(localStorage.getItem("kids_math.workbook_progress.v2.grade.a")).toBeNull();
      expect(localStorage.getItem("kids_math.workbook_progress.v2.grade.b")).toBeTruthy();
    });
  });

  describe("saveBadgeState", () => {
    it("still writes data to localStorage", () => {
      const state = createInitialBadgeState("a");
      saveBadgeState(state);
      expect(localStorage.getItem("kids_math.badges.v1.grade.a")).toBeTruthy();
    });

    it("calls scheduleSync once per save", () => {
      saveBadgeState(createInitialBadgeState("a"));
      expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    });

    it("data round-trips correctly", () => {
      const state = { ...createInitialBadgeState("a"), unlocked: [{ id: "first-day-done" as const, unlockedAt: "2024-01-01T00:00:00Z" }] };
      saveBadgeState(state);
      const loaded = loadBadgeState("a");
      expect(loaded.unlocked).toHaveLength(1);
      expect(loaded.unlocked[0]?.id).toBe("first-day-done");
    });
  });

  describe("saveStreakState", () => {
    it("still writes data to localStorage", () => {
      saveStreakState(makeStreakState());
      expect(localStorage.getItem("kids_math.streak.v1")).toBeTruthy();
    });

    it("calls scheduleSync once per save", () => {
      saveStreakState(makeStreakState());
      expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    });

    it("data round-trips correctly", () => {
      const state = makeStreakState();
      saveStreakState(state);
      const loaded = loadStreakState();
      expect(loaded?.currentStreak).toBe(3);
      expect(loaded?.longestStreak).toBe(5);
    });
  });

  describe("saveFinalExamState", () => {
    it("still writes data to localStorage", () => {
      const state: FinalExamState = {
        version: 1,
        grade: "a",
        createdAt: new Date().toISOString(),
        pickerVersion: 1,
        selectedExerciseIds: Array.from({ length: 20 }, (_, i) => `ex-${i}` as never),
        answers: {},
        correctMap: {},
        attempts: {},
      };
      saveFinalExamState("a", state);
      expect(localStorage.getItem("kids_math.final_exam.v1.grade.a")).toBeTruthy();
    });

    it("calls scheduleSync once per save", () => {
      const state: FinalExamState = {
        version: 1,
        grade: "a",
        createdAt: new Date().toISOString(),
        pickerVersion: 1,
        selectedExerciseIds: Array.from({ length: 20 }, (_, i) => `ex-${i}` as never),
        answers: {},
        correctMap: {},
        attempts: {},
      };
      saveFinalExamState("a", state);
      expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    });

    it("does not write grade B key when saving grade A", () => {
      const state: FinalExamState = {
        version: 1,
        grade: "a",
        createdAt: new Date().toISOString(),
        pickerVersion: 1,
        selectedExerciseIds: Array.from({ length: 20 }, (_, i) => `ex-${i}` as never),
        answers: {},
        correctMap: {},
        attempts: {},
      };
      saveFinalExamState("a", state);
      expect(localStorage.getItem("kids_math.final_exam.v1.grade.b")).toBeNull();
    });
  });

  describe("saveGmatChallengeState", () => {
    it("still writes data to localStorage", () => {
      const state = createInitialRulesState("a");
      saveGmatChallengeState("a", state);
      expect(localStorage.getItem("kids_math.gmat_challenge.v1.grade.a")).toBeTruthy();
    });

    it("calls scheduleSync once per save", () => {
      saveGmatChallengeState("a", createInitialRulesState("a"));
      expect(scheduleSyncMock).toHaveBeenCalledTimes(1);
    });

    it("data round-trips correctly", () => {
      const state = createInitialRulesState("a");
      saveGmatChallengeState("a", state);
      const loaded = loadGmatChallengeState("a");
      expect(loaded?.phase).toBe("rules");
      expect(loaded?.grade).toBe("a");
    });
  });

  describe("scheduleSync call count across multiple saves", () => {
    it("each save function calls scheduleSync independently — N saves → N calls", () => {
      saveProgressState(makeProgressState(), { grade: "a" });
      saveBadgeState(createInitialBadgeState("a"));
      saveStreakState(makeStreakState());
      expect(scheduleSyncMock).toHaveBeenCalledTimes(3);
    });
  });
});
