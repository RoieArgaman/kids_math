import { describe, expect, it } from "vitest";
import type { DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import {
  applyBestTimeMsIfImproved,
  calculatePercentDone,
  canUnlockNextDay,
  computeElapsedMsForCompletedDay,
  createInitialWorkbookProgressState,
  forceMarkDayComplete,
  forceMarkSectionComplete,
  markDayComplete,
  mergeBestTimeMs,
  resetDayProgress,
  resetSectionProgress,
  setAnswerForDay,
} from "@/lib/progress/engine";

function makeDay(dayId: DayId, unlockThresholdPercent = 100): WorkbookDay {
  return {
    id: dayId,
    dayNumber: 1,
    title: "יום בדיקה",
    week: 1,
    objective: "בדיקה",
    spiralReviewTags: [],
    unlockThresholdPercent,
    sections: [],
  };
}

describe("calculatePercentDone", () => {
  it("returns 0 when totalExercises <= 0", () => {
    expect(calculatePercentDone(0, 0)).toBe(0);
    expect(calculatePercentDone(10, 0)).toBe(0);
    expect(calculatePercentDone(10, -1)).toBe(0);
  });

  it("rounds and clamps to [0,100]", () => {
    expect(calculatePercentDone(1, 3)).toBe(33);
    expect(calculatePercentDone(2, 3)).toBe(67);
    expect(calculatePercentDone(3, 3)).toBe(100);
    expect(calculatePercentDone(999, 3)).toBe(100);
    expect(calculatePercentDone(-5, 3)).toBe(0);
  });
});

describe("setAnswerForDay / completion semantics", () => {
  it("marks completion sticky once reaching 100%", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.isComplete).toBe(true);
    expect(state.days["day-1"]?.percentDone).toBe(100);

    // Now submit an incorrect answer; percent should drop but completion should remain true.
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 2,
      isCorrect: false,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.percentDone).toBe(0);
    expect(state.days["day-1"]?.isComplete).toBe(true);
  });

  it("does not mark complete if below 100%", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 2,
    });
    expect(state.days["day-1"]?.percentDone).toBe(50);
    expect(state.days["day-1"]?.isComplete).toBe(false);
  });
});

describe("markDayComplete", () => {
  it("does not mark complete when percentDone is below 100%", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 2,
    });

    const next = markDayComplete(state, "day-1");
    expect(next).toBe(state); // unchanged
    expect(next.days["day-1"]?.isComplete).toBe(false);
  });
});

describe("forceMarkDayComplete", () => {
  it("marks complete with 100% and sets completedAt", () => {
    const state = createInitialWorkbookProgressState();
    const next = forceMarkDayComplete(state, "day-1");
    const day = next.days["day-1"];
    expect(day?.isComplete).toBe(true);
    expect(day?.percentDone).toBe(100);
    expect(day?.completedAt).toBeTruthy();
    expect(next.version).toBe(1);
    expect(typeof next.updatedAt).toBe("string");
  });

  it("is idempotent on completion semantics", () => {
    const state = createInitialWorkbookProgressState();
    const once = forceMarkDayComplete(state, "day-1");
    const twice = forceMarkDayComplete(once, "day-1");
    expect(twice.days["day-1"]?.isComplete).toBe(true);
    expect(twice.days["day-1"]?.percentDone).toBe(100);
    expect(twice.days["day-1"]?.completedAt).toBe(once.days["day-1"]?.completedAt);
    expect(Object.keys(twice.days["day-1"] ?? {}).sort()).toEqual(
      ["answers", "attempts", "completedAt", "correctAnswers", "dayId", "isComplete", "percentDone", "wrongBySection", "wrongCount"].sort(),
    );
  });

  it("can prefill day answers when requested", () => {
    const day = getWorkbookDaysById("a")["day-1"];
    const state = createInitialWorkbookProgressState();
    const next = forceMarkDayComplete(state, "day-1", { day, fillAnswers: true });
    const dayState = next.days["day-1"];
    expect(dayState?.isComplete).toBe(true);
    expect(dayState?.percentDone).toBe(100);
    expect(Object.keys(dayState?.answers ?? {}).length).toBeGreaterThan(0);
    expect(Object.values(dayState?.correctAnswers ?? {}).every(Boolean)).toBe(true);
    expect((dayState?.attempts ?? []).length).toBe(Object.keys(dayState?.answers ?? {}).length);
  });
});

describe("forceMarkSectionComplete", () => {
  const day1 = getWorkbookDaysById("a")["day-1"];

  it("forcing only the first section leaves percentDone below 100 and not complete (from empty state)", () => {
    const state = createInitialWorkbookProgressState();
    const firstSectionId = day1.sections[0]!.id;
    const next = forceMarkSectionComplete(state, "day-1", firstSectionId, { day: day1 });
    const dayState = next.days["day-1"];
    expect(dayState?.percentDone).toBeLessThan(100);
    expect(dayState?.isComplete).toBe(false);
  });

  it("forcing all sections sequentially completes the day at 100%", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    for (const section of day1.sections) {
      state = forceMarkSectionComplete(state, "day-1", section.id, { day: day1 });
    }
    const dayState = state.days["day-1"];
    expect(dayState?.percentDone).toBe(100);
    expect(dayState?.isComplete).toBe(true);
  });

  it("is idempotent when called twice on the same section", () => {
    const state = createInitialWorkbookProgressState();
    const sectionId = day1.sections[0]!.id;
    const once = forceMarkSectionComplete(state, "day-1", sectionId, { day: day1 });
    const twice = forceMarkSectionComplete(once, "day-1", sectionId, { day: day1 });
    expect(twice.days["day-1"]?.percentDone).toBe(once.days["day-1"]?.percentDone);
  });

  it("returns unchanged state for a section id not present in the workbook day", () => {
    const state = createInitialWorkbookProgressState();
    const next = forceMarkSectionComplete(state, "day-1", "day-1-section-999-fake", { day: day1 });
    expect(next).toBe(state);
    expect(next.days["day-1"]).toBeUndefined();
  });

  it("returns unchanged when options.day is missing", () => {
    const state = createInitialWorkbookProgressState();
    const next = forceMarkSectionComplete(state, "day-1", day1.sections[0]!.id, {});
    expect(next).toBe(state);
  });
});

describe("resetDayProgress", () => {
  it("resets day fields to initial values", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.isComplete).toBe(true);

    const reset = resetDayProgress(state, "day-1");
    expect(reset.days["day-1"]?.isComplete).toBe(false);
    expect(reset.days["day-1"]?.percentDone).toBe(0);
    expect(reset.days["day-1"]?.wrongCount).toBe(0);
    expect(reset.days["day-1"]?.wrongBySection).toEqual({});
    expect(reset.days["day-1"]?.attempts).toEqual([]);
  });
});

describe("canUnlockNextDay", () => {
  it("requires isComplete and meeting the day unlock threshold", () => {
    const day = makeDay("day-1", 90);

    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 10,
    });
    // 10% done, not complete.
    expect(canUnlockNextDay(day, state.days["day-1"])).toBe(false);

    // Force 100% to make complete and pass threshold.
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-2",
      answer: 1,
      isCorrect: true,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.percentDone).toBe(100);
    expect(state.days["day-1"]?.isComplete).toBe(true);
    expect(canUnlockNextDay(day, state.days["day-1"])).toBe(true);
  });
});


describe("computeElapsedMsForCompletedDay", () => {
  it("returns elapsed from first attempt to completedAt when gate is met", () => {
    const dayState = {
      dayId: "day-1" as const,
      answers: {},
      correctAnswers: {},
      wrongCount: 0,
      wrongBySection: {},
      attempts: [
        {
          exerciseId: "e1",
          answer: 1,
          isCorrect: true,
          attemptedAt: "2020-01-01T00:00:00.000Z",
        },
      ],
      percentDone: 100,
      isComplete: true,
      completedAt: "2020-01-01T00:05:00.000Z",
    };
    expect(computeElapsedMsForCompletedDay(dayState)).toBe(5 * 60 * 1000);
  });

  it("returns null without completedAt", () => {
    const dayState = {
      dayId: "day-1" as const,
      answers: {},
      correctAnswers: {},
      wrongCount: 0,
      wrongBySection: {},
      attempts: [],
      percentDone: 100,
      isComplete: true,
    };
    expect(computeElapsedMsForCompletedDay(dayState)).toBeNull();
  });

  it("returns null when percentDone is below completion gate", () => {
    const dayState = {
      dayId: "day-1" as const,
      answers: {},
      correctAnswers: {},
      wrongCount: 0,
      wrongBySection: {},
      attempts: [
        {
          exerciseId: "e1",
          answer: 1,
          isCorrect: true,
          attemptedAt: "2020-01-01T00:00:00.000Z",
        },
      ],
      percentDone: 50,
      isComplete: false,
      completedAt: "2020-01-01T00:05:00.000Z",
    };
    expect(computeElapsedMsForCompletedDay(dayState)).toBeNull();
  });

  it("returns 0 when completedAt is before first attempt (clock skew)", () => {
    const dayState = {
      dayId: "day-1" as const,
      answers: {},
      correctAnswers: {},
      wrongCount: 0,
      wrongBySection: {},
      attempts: [
        {
          exerciseId: "e1",
          answer: 1,
          isCorrect: true,
          attemptedAt: "2020-01-01T00:05:00.000Z",
        },
      ],
      percentDone: 100,
      isComplete: true,
      completedAt: "2020-01-01T00:00:00.000Z",
    };
    expect(computeElapsedMsForCompletedDay(dayState)).toBe(0);
  });
});

describe("applyBestTimeMsIfImproved", () => {
  it("sets bestTimeMs when undefined", () => {
    let state = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 1,
    });
    const next = applyBestTimeMsIfImproved(state, "day-1", 42_000);
    expect(next.days["day-1"]?.bestTimeMs).toBe(42_000);
  });

  it("lowers bestTimeMs when new elapsed is smaller", () => {
    let state = createInitialWorkbookProgressState();
    state = {
      ...state,
      days: {
        "day-1": {
          dayId: "day-1",
          answers: {},
          correctAnswers: {},
          wrongCount: 0,
          wrongBySection: {},
          attempts: [],
          percentDone: 100,
          isComplete: true,
          bestTimeMs: 120_000,
        },
      },
      updatedAt: state.updatedAt,
    };
    const next = applyBestTimeMsIfImproved(state, "day-1", 60_000);
    expect(next.days["day-1"]?.bestTimeMs).toBe(60_000);
  });

  it("returns unchanged state when elapsed is not an improvement", () => {
    let state = createInitialWorkbookProgressState();
    state = {
      ...state,
      days: {
        "day-1": {
          dayId: "day-1",
          answers: {},
          correctAnswers: {},
          wrongCount: 0,
          wrongBySection: {},
          attempts: [],
          percentDone: 100,
          isComplete: true,
          bestTimeMs: 60_000,
        },
      },
      updatedAt: state.updatedAt,
    };
    const before = state.updatedAt;
    const next = applyBestTimeMsIfImproved(state, "day-1", 120_000);
    expect(next).toBe(state);
    expect(next.days["day-1"]?.bestTimeMs).toBe(60_000);
    expect(next.updatedAt).toBe(before);
  });

  it("returns unchanged state for non-finite or negative elapsed", () => {
    const state = createInitialWorkbookProgressState();
    expect(applyBestTimeMsIfImproved(state, "day-1", NaN)).toBe(state);
    expect(applyBestTimeMsIfImproved(state, "day-1", -1)).toBe(state);
    expect(applyBestTimeMsIfImproved(state, "day-1", Number.POSITIVE_INFINITY)).toBe(state);
  });
});

describe("mergeBestTimeMs", () => {
  it("matches personal-best min semantics", () => {
    expect(mergeBestTimeMs(undefined, 100)).toBe(100);
    expect(mergeBestTimeMs(200, 100)).toBe(100);
    expect(mergeBestTimeMs(100, 200)).toBe(100);
  });
});

describe("setAnswerForDay wrongCount after sticky complete", () => {
  it("does not increment wrongBySection when isComplete is already true; wrongCount follows attempts", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.wrongCount).toBe(0);
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 2,
      isCorrect: false,
      totalExercises: 1,
    });
    expect(state.days["day-1"]?.isComplete).toBe(true);
    expect(state.days["day-1"]?.wrongBySection["day-1-section-1"] ?? 0).toBe(0);
    expect(state.days["day-1"]?.wrongCount).toBe(1);
  });
});

describe("markDayComplete bestTimeMs", () => {
  it("sets bestTimeMs from elapsed between first attempt and completedAt", () => {
    const state: WorkbookProgressState = {
      ...createInitialWorkbookProgressState(),
      days: {
        "day-1": {
          dayId: "day-1",
          answers: {},
          correctAnswers: {},
          wrongCount: 0,
          wrongBySection: {},
          attempts: [
            {
              exerciseId: "e1",
              answer: 1,
              isCorrect: true,
              attemptedAt: "2020-01-01T00:00:00.000Z",
            },
          ],
          percentDone: 100,
          isComplete: true,
          completedAt: "2020-01-01T00:03:00.000Z",
        },
      },
    };
    const next = markDayComplete(state, "day-1");
    expect(next.days["day-1"]?.bestTimeMs).toBe(3 * 60 * 1000);
    expect(next.days["day-1"]?.isComplete).toBe(true);
  });

  it("keeps existing bestTimeMs when completion elapsed is slower", () => {
    const state: WorkbookProgressState = {
      ...createInitialWorkbookProgressState(),
      days: {
        "day-1": {
          dayId: "day-1",
          answers: {},
          correctAnswers: {},
          wrongCount: 0,
          wrongBySection: {},
          attempts: [
            {
              exerciseId: "e1",
              answer: 1,
              isCorrect: true,
              attemptedAt: "2020-01-01T00:00:00.000Z",
            },
          ],
          percentDone: 100,
          isComplete: true,
          completedAt: "2020-01-01T00:10:00.000Z",
          bestTimeMs: 60_000,
        },
      },
    };
    const next = markDayComplete(state, "day-1");
    expect(next.days["day-1"]?.bestTimeMs).toBe(60_000);
  });
});

describe("wrongBySection / resetSectionProgress", () => {
  it("tracks wrong answers per section independently", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-0",
      exerciseId: "day-1-section-0-exercise-1",
      answer: 0,
      isCorrect: false,
      totalExercises: 4,
    });
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 0,
      isCorrect: false,
      totalExercises: 4,
    });
    expect(state.days["day-1"]?.wrongBySection["day-1-section-0"]).toBe(1);
    expect(state.days["day-1"]?.wrongBySection["day-1-section-1"]).toBe(1);
  });

  it("resetSectionProgress clears only the given section and zeros its mistake counter", () => {
    let state: WorkbookProgressState = createInitialWorkbookProgressState();
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-0",
      exerciseId: "day-1-section-0-exercise-1",
      answer: 1,
      isCorrect: true,
      totalExercises: 4,
    });
    state = setAnswerForDay(state, {
      dayId: "day-1",
      sectionId: "day-1-section-1",
      exerciseId: "day-1-section-1-exercise-1",
      answer: 0,
      isCorrect: false,
      totalExercises: 4,
    });
    const next = resetSectionProgress(state, "day-1", "day-1-section-1", ["day-1-section-1-exercise-1"], 4);
    expect(next.days["day-1"]?.answers["day-1-section-0-exercise-1"]).toBe(1);
    expect(next.days["day-1"]?.answers["day-1-section-1-exercise-1"]).toBeUndefined();
    expect(next.days["day-1"]?.wrongBySection["day-1-section-1"] ?? 0).toBe(0);
    expect(next.days["day-1"]?.wrongCount).toBe(0);
  });
});
