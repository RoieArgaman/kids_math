import { describe, expect, it } from "vitest";
import type { DayId, ExerciseId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import type { DayProgressState, ExerciseAttempt } from "@/lib/types/progress";
import type { FinalExamState } from "@/lib/final-exam/types";
import { evaluateBadges } from "@/lib/badges/engine";

// ---- fixture helpers ------------------------------------------------------

function makeWorkbookDay(dayId: DayId, week = 1): WorkbookDay {
  return {
    id: dayId,
    dayNumber: 1,
    title: "יום בדיקה",
    week,
    objective: "בדיקה",
    spiralReviewTags: [],
    unlockThresholdPercent: 100,
    sections: [],
  };
}

interface DayProgressOptions {
  isComplete?: boolean;
  /** exercise id -> isCorrect on FIRST attempt */
  attempts?: Array<{ exerciseId: string; isCorrect: boolean; attemptedAt?: string }>;
  /** number of distinct answered exercises (for totalAnswers counting) */
  answerCount?: number;
  bestTimeMs?: number;
  wrongCount?: number;
  completedAt?: string;
}

function makeDayProgress(dayId: DayId, opts: DayProgressOptions = {}): DayProgressState {
  const attempts: ExerciseAttempt[] = (opts.attempts ?? []).map((a) => ({
    exerciseId: a.exerciseId as ExerciseId,
    answer: 1,
    isCorrect: a.isCorrect,
    attemptedAt: a.attemptedAt ?? "2024-03-10T10:00:00.000Z",
  }));

  const answers: Record<ExerciseId, number> = {};
  const answerCount = opts.answerCount ?? attempts.length;
  for (let i = 0; i < answerCount; i++) {
    answers[`${dayId}-section-1-exercise-${i + 1}` as ExerciseId] = 1;
  }

  return {
    dayId,
    answers,
    correctAnswers: {},
    wrongCount: opts.wrongCount ?? 0,
    wrongBySection: {},
    attempts,
    completedAt: opts.completedAt,
    bestTimeMs: opts.bestTimeMs,
    percentDone: opts.isComplete ? 100 : 0,
    isComplete: opts.isComplete ?? false,
  };
}

function makeProgress(days: Record<string, DayProgressState>): WorkbookProgressState {
  return {
    version: 1,
    days: days as WorkbookProgressState["days"],
    updatedAt: "2024-03-10T10:00:00.000Z",
  };
}

function makeFinalExam(overrides: Partial<FinalExamState> = {}): FinalExamState {
  return {
    version: 1,
    grade: "a",
    createdAt: "2024-03-10T10:00:00.000Z",
    pickerVersion: 1,
    selectedExerciseIds: [],
    answers: {},
    correctMap: {},
    attempts: {},
    ...overrides,
  };
}

// A tiny curriculum of just day-1 (week 1). No ministry strand is satisfiable
// from a single day, so strand badges never fire incidentally.
const tinyCurriculum: WorkbookDay[] = [makeWorkbookDay("day-1", 1)];

function evaluate(
  progress: WorkbookProgressState,
  finalExam: FinalExamState | null = null,
  curriculum: WorkbookDay[] = tinyCurriculum,
) {
  return evaluateBadges({ progress, finalExam, curriculum, grade: "a" });
}

// ---- tests ----------------------------------------------------------------

describe("evaluateBadges — shape & empty", () => {
  it("returns an array and no badges for empty progress", () => {
    const result = evaluate(makeProgress({}));
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});

describe("evaluateBadges — first-day-done", () => {
  it("is earned only when day-1 is complete", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          attempts: [{ exerciseId: "day-1-section-1-exercise-1", isCorrect: true }],
        }),
      }),
    );
    expect(result).toContain("first-day-done");
  });

  it("is absent when day-1 is not complete", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: false }),
      }),
    );
    expect(result).not.toContain("first-day-done");
  });
});

describe("evaluateBadges — completed-day count streaks", () => {
  function nCompletedDays(n: number): WorkbookProgressState {
    const days: Record<string, DayProgressState> = {};
    for (let i = 1; i <= n; i++) {
      days[`day-${i}`] = makeDayProgress(`day-${i}` as DayId, { isComplete: true });
    }
    return makeProgress(days);
  }

  it("2 completed days earns no count-streak badge (boundary)", () => {
    const result = evaluate(nCompletedDays(2));
    expect(result).not.toContain("streak-3-days");
    expect(result).not.toContain("streak-5-days");
    expect(result).not.toContain("streak-10-days");
  });

  it("3 completed days earns streak-3-days", () => {
    const result = evaluate(nCompletedDays(3));
    expect(result).toContain("streak-3-days");
    expect(result).not.toContain("streak-5-days");
  });

  it("5 completed days earns streak-3-days + streak-5-days", () => {
    const result = evaluate(nCompletedDays(5));
    expect(result).toContain("streak-3-days");
    expect(result).toContain("streak-5-days");
    expect(result).not.toContain("streak-10-days");
  });

  it("10 completed days earns streak-10-days", () => {
    const result = evaluate(nCompletedDays(10));
    expect(result).toContain("streak-10-days");
  });
});

describe("evaluateBadges — zero-mistakes / sharp-mind (first-attempt perfect)", () => {
  it("earns zero-mistakes for one perfect day", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          attempts: [
            { exerciseId: "day-1-section-1-exercise-1", isCorrect: true },
            { exerciseId: "day-1-section-1-exercise-2", isCorrect: true },
          ],
        }),
      }),
    );
    expect(result).toContain("zero-mistakes");
    expect(result).not.toContain("sharp-mind"); // needs >= 3 perfect days
  });

  it("does not earn zero-mistakes when the first attempt was wrong", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          attempts: [
            { exerciseId: "day-1-section-1-exercise-1", isCorrect: false },
            // a later correct retry on the same exercise must NOT rescue it
            { exerciseId: "day-1-section-1-exercise-1", isCorrect: true },
          ],
        }),
      }),
    );
    expect(result).not.toContain("zero-mistakes");
  });

  it("requires the day to be complete (incomplete perfect day does not count)", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: false,
          attempts: [{ exerciseId: "day-1-section-1-exercise-1", isCorrect: true }],
        }),
      }),
    );
    expect(result).not.toContain("zero-mistakes");
  });

  it("earns sharp-mind at 3 perfect days", () => {
    const days: Record<string, DayProgressState> = {};
    for (let i = 1; i <= 3; i++) {
      days[`day-${i}`] = makeDayProgress(`day-${i}` as DayId, {
        isComplete: true,
        attempts: [{ exerciseId: `day-${i}-section-1-exercise-1`, isCorrect: true }],
      });
    }
    const result = evaluate(makeProgress(days));
    expect(result).toContain("zero-mistakes");
    expect(result).toContain("sharp-mind");
  });
});

describe("evaluateBadges — speed-runner", () => {
  it("earns speed-runner for a completed day under 5 minutes", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true, bestTimeMs: 299_999 }),
      }),
    );
    expect(result).toContain("speed-runner");
  });

  it("is absent when bestTimeMs is exactly 300000 (boundary, not strictly less)", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true, bestTimeMs: 300_000 }),
      }),
    );
    expect(result).not.toContain("speed-runner");
  });

  it("is absent when bestTimeMs is undefined", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true }),
      }),
    );
    expect(result).not.toContain("speed-runner");
  });
});

describe("evaluateBadges — exam performance", () => {
  const completedDay1 = makeProgress({
    "day-1": makeDayProgress("day-1", { isComplete: true }),
  });

  it("earns exam-high-score at >= 90 when passed", () => {
    const result = evaluate(completedDay1, makeFinalExam({ passed: true, scorePercent: 90 }));
    expect(result).toContain("exam-high-score");
    expect(result).not.toContain("exam-ace");
  });

  it("earns exam-ace only at 100", () => {
    const result = evaluate(completedDay1, makeFinalExam({ passed: true, scorePercent: 100 }));
    expect(result).toContain("exam-high-score");
    expect(result).toContain("exam-ace");
  });

  it("is absent at 89 (boundary below high-score)", () => {
    const result = evaluate(completedDay1, makeFinalExam({ passed: true, scorePercent: 89 }));
    expect(result).not.toContain("exam-high-score");
    expect(result).not.toContain("exam-ace");
  });

  it("is absent when the exam was not passed even at score 100", () => {
    const result = evaluate(completedDay1, makeFinalExam({ passed: false, scorePercent: 100 }));
    expect(result).not.toContain("exam-high-score");
    expect(result).not.toContain("exam-ace");
  });

  it("is absent when finalExam is null", () => {
    const result = evaluate(completedDay1, null);
    expect(result).not.toContain("exam-high-score");
    expect(result).not.toContain("exam-ace");
  });
});

describe("evaluateBadges — hundred-answers boundary", () => {
  it("earns hundred-answers when completed days contribute >= 100 answers", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true, answerCount: 100 }),
      }),
    );
    expect(result).toContain("hundred-answers");
    expect(result).not.toContain("five-hundred-answers");
  });

  it("is absent at 99 answers (boundary)", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true, answerCount: 99 }),
      }),
    );
    expect(result).not.toContain("hundred-answers");
  });

  it("does not count answers from incomplete days", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: false, answerCount: 200 }),
      }),
    );
    expect(result).not.toContain("hundred-answers");
  });
});
