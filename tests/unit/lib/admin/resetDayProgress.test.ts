import { describe, expect, it, vi } from "vitest";
import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { resetAdminDayProgress } from "@/lib/admin/resetDayProgress";
import * as gmatStorage from "@/lib/gmat-challenge/storage";
import * as finalExamStorage from "@/lib/final-exam/storage";
import {
  createInitialWorkbookProgressState,
  createInitialDayProgressState,
  resetDayProgress,
} from "@/lib/progress/engine";
import type { DayId, WorkbookProgressState } from "@/lib/types";

function seedState(): WorkbookProgressState {
  const base = createInitialWorkbookProgressState();
  return {
    ...base,
    days: {
      "day-29": {
        dayId: "day-29",
        answers: {},
        correctAnswers: {},
        wrongCount: 0,
        wrongBySection: {},
        attempts: [],
        percentDone: 50,
        isComplete: false,
      },
    },
  };
}

function cascadeResetWorkbook(state: WorkbookProgressState, startDayId: DayId, grade: "a" | "b"): WorkbookProgressState {
  const ordered = getWorkbookDays(grade);
  const startIndex = ordered.findIndex((d) => d.id === startDayId);
  let next = state;
  for (let i = startIndex; i < ordered.length; i++) {
    next = resetDayProgress(next, ordered[i].id as DayId);
  }
  return next;
}

function withoutUpdatedAt(state: WorkbookProgressState): Omit<WorkbookProgressState, "updatedAt"> {
  const { updatedAt: _ignored, ...rest } = state;
  return rest;
}

describe("resetAdminDayProgress", () => {
  it("returns null when dayId is not in the workbook", () => {
    expect(resetAdminDayProgress(seedState(), "day-999" as DayId, "a")).toBeNull();
  });

  it("clears final exam and GMAT challenge storage when resetting the final exam day", () => {
    const clearSpy = vi.spyOn(finalExamStorage, "clearFinalExamState");
    const gmatSpy = vi.spyOn(gmatStorage, "clearGmatChallengeState");
    const state = seedState();

    const result = resetAdminDayProgress(state, FINAL_EXAM_DAY_ID, "a");
    expect(result).not.toBeNull();

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledWith("a");
    expect(gmatSpy).toHaveBeenCalledWith("a");
    expect(result?.shouldRevokeGradeBUnlock).toBe(true);
    expect(result?.cascadeTouchedFinalExam).toBe(true);
    clearSpy.mockRestore();
    gmatSpy.mockRestore();
  });

  it("clears final exam storage for grade b when resetting the final exam day", () => {
    const clearSpy = vi.spyOn(finalExamStorage, "clearFinalExamState");
    const gmatSpy = vi.spyOn(gmatStorage, "clearGmatChallengeState");

    const result = resetAdminDayProgress(seedState(), FINAL_EXAM_DAY_ID, "b");
    expect(result?.shouldRevokeGradeBUnlock).toBe(false);

    expect(clearSpy).toHaveBeenCalledWith("b");
    expect(gmatSpy).toHaveBeenCalledWith("b");
    clearSpy.mockRestore();
    gmatSpy.mockRestore();
  });

  it("clears final exam when resetting an earlier day because cascade reaches day-29", () => {
    const clearSpy = vi.spyOn(finalExamStorage, "clearFinalExamState");
    const gmatSpy = vi.spyOn(gmatStorage, "clearGmatChallengeState");
    const state = seedState();

    resetAdminDayProgress(state, "day-1", "a");

    expect(clearSpy).toHaveBeenCalledWith("a");
    expect(gmatSpy).toHaveBeenCalledWith("a");
    clearSpy.mockRestore();
    gmatSpy.mockRestore();
  });

  it("next state resets from chosen day through end of workbook", () => {
    const state: WorkbookProgressState = {
      ...createInitialWorkbookProgressState(),
      days: {
        "day-3": { ...createInitialDayProgressState("day-3"), isComplete: true, percentDone: 100 },
        "day-4": { ...createInitialDayProgressState("day-4"), isComplete: true, percentDone: 100 },
      },
    };

    const result = resetAdminDayProgress(state, "day-3", "a");
    expect(result).not.toBeNull();
    const expected = cascadeResetWorkbook(state, "day-3", "a");
    expect(withoutUpdatedAt(result!.nextState)).toEqual(withoutUpdatedAt(expected));
    expect(result?.nextState.days["day-3"]?.isComplete).toBe(false);
    expect(result?.nextState.days["day-4"]?.isComplete).toBe(false);
  });

  it("matches cascade-only workbook reset for mid workbook start", () => {
    const state = seedState();
    const result = resetAdminDayProgress(state, "day-5", "a");
    expect(withoutUpdatedAt(result!.nextState)).toEqual(
      withoutUpdatedAt(cascadeResetWorkbook(state, "day-5", "a")),
    );
  });
});
