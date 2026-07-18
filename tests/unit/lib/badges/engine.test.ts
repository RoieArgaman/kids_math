import { describe, expect, it } from "vitest";
import type { DayId, ExerciseId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import type { DayProgressState, ExerciseAttempt } from "@/lib/types/progress";
import type { FinalExamState } from "@/lib/final-exam/types";
import { evaluateBadges } from "@/lib/badges/engine";
import { getMinistryStrandsForGrade } from "@/lib/content/curriculum-plan";

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

  it("earns five-hundred-answers at 500 and sums across completed days", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: true, answerCount: 250 }),
        "day-2": makeDayProgress("day-2", { isComplete: true, answerCount: 250 }),
      }),
    );
    expect(result).toContain("hundred-answers");
    expect(result).toContain("five-hundred-answers");
  });
});

// ---------------------------------------------------------------------------
// Higher badge tiers.
//
// The tests above cover the entry-level rung of each ladder. These cover the
// upper rungs, which are the ones a child actually chases — and the ones where
// an off-by-one silently makes a badge unearnable forever. Each tier is pinned
// at its exact threshold and one below it.
// ---------------------------------------------------------------------------

/** n completed days, each first-attempt perfect. */
function nPerfectDays(n: number, opts: DayProgressOptions = {}): WorkbookProgressState {
  const days: Record<string, DayProgressState> = {};
  for (let i = 1; i <= n; i++) {
    days[`day-${i}`] = makeDayProgress(`day-${i}` as DayId, {
      isComplete: true,
      attempts: [{ exerciseId: `day-${i}-section-1-exercise-1`, isCorrect: true }],
      ...opts,
    });
  }
  return makeProgress(days);
}

describe("evaluateBadges — perfect-day tiers (flawless-five / zero-hero)", () => {
  it("4 perfect days is one short of flawless-five", () => {
    const result = evaluate(nPerfectDays(4));
    expect(result).toContain("sharp-mind");
    expect(result).not.toContain("flawless-five");
  });

  it("5 perfect days earns flawless-five but not zero-hero", () => {
    const result = evaluate(nPerfectDays(5));
    expect(result).toContain("flawless-five");
    expect(result).not.toContain("zero-hero");
  });

  it("9 perfect days is one short of zero-hero", () => {
    expect(evaluate(nPerfectDays(9))).not.toContain("zero-hero");
  });

  it("10 perfect days earns the full ladder up to zero-hero", () => {
    const result = evaluate(nPerfectDays(10));
    expect(result).toContain("zero-mistakes");
    expect(result).toContain("sharp-mind");
    expect(result).toContain("flawless-five");
    expect(result).toContain("zero-hero");
  });
});

describe("evaluateBadges — speed tiers", () => {
  it("2 fast days is one short of speed-trio", () => {
    const result = evaluate(nPerfectDays(2, { bestTimeMs: 200_000 }));
    expect(result).toContain("speed-runner");
    expect(result).not.toContain("speed-trio");
  });

  it("3 fast days earns speed-trio", () => {
    expect(evaluate(nPerfectDays(3, { bestTimeMs: 200_000 }))).toContain("speed-trio");
  });

  it("earns lightning-fast under 3 minutes", () => {
    expect(evaluate(nPerfectDays(1, { bestTimeMs: 179_999 }))).toContain("lightning-fast");
  });

  it("is absent at exactly 180000ms (boundary, not strictly less)", () => {
    const result = evaluate(nPerfectDays(1, { bestTimeMs: 180_000 }));
    expect(result).not.toContain("lightning-fast");
    expect(result).toContain("speed-runner"); // still under the 5-minute bar
  });

  it("does not count a fast but incomplete day", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", { isComplete: false, bestTimeMs: 1000 }),
      }),
    );
    expect(result).not.toContain("lightning-fast");
    expect(result).not.toContain("speed-runner");
  });
});

describe("evaluateBadges — week completion", () => {
  /** A curriculum of `weeks` weeks x 2 days, with the first `completeWeeks` done. */
  function weeksFixture(weeks: number, completeWeeks: number) {
    const curriculum: WorkbookDay[] = [];
    const days: Record<string, DayProgressState> = {};
    let dayNum = 1;
    for (let w = 1; w <= weeks; w++) {
      for (let d = 0; d < 2; d++) {
        const id = `day-${dayNum}` as DayId;
        curriculum.push(makeWorkbookDay(id, w));
        if (w <= completeWeeks) {
          days[id] = makeDayProgress(id, { isComplete: true });
        }
        dayNum++;
      }
    }
    return { curriculum, progress: makeProgress(days) };
  }

  it("earns week-1-complete when every day in week 1 is done", () => {
    const { curriculum, progress } = weeksFixture(4, 1);
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("week-1-complete");
    expect(result).not.toContain("week-2-complete");
  });

  it("earns each week badge cumulatively through week 4", () => {
    const { curriculum, progress } = weeksFixture(4, 4);
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("week-1-complete");
    expect(result).toContain("week-2-complete");
    expect(result).toContain("week-3-complete");
    expect(result).toContain("week-4-complete");
  });

  it("does not earn a week badge when one day of that week is missing", () => {
    const { curriculum, progress } = weeksFixture(2, 2);
    delete (progress.days as Record<string, DayProgressState>)["day-3"];
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("week-1-complete");
    expect(result).not.toContain("week-2-complete");
  });

  it("does not earn a week badge for a week with no days in the curriculum", () => {
    const { curriculum, progress } = weeksFixture(1, 1);
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("week-1-complete");
    expect(result).not.toContain("week-2-complete");
  });
});

describe("evaluateBadges — perfect-week / perfect-two-weeks", () => {
  function perfectWeeksFixture(weeks: number, perfectWeeks: number) {
    const curriculum: WorkbookDay[] = [];
    const days: Record<string, DayProgressState> = {};
    let dayNum = 1;
    for (let w = 1; w <= weeks; w++) {
      for (let d = 0; d < 2; d++) {
        const id = `day-${dayNum}` as DayId;
        curriculum.push(makeWorkbookDay(id, w));
        days[id] = makeDayProgress(id, {
          isComplete: true,
          attempts: [{ exerciseId: `${id}-section-1-exercise-1`, isCorrect: w <= perfectWeeks }],
        });
        dayNum++;
      }
    }
    return { curriculum, progress: makeProgress(days) };
  }

  it("earns perfect-week for one flawless week", () => {
    const { curriculum, progress } = perfectWeeksFixture(2, 1);
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("perfect-week");
    expect(result).not.toContain("perfect-two-weeks");
  });

  it("earns perfect-two-weeks for two flawless weeks", () => {
    const { curriculum, progress } = perfectWeeksFixture(2, 2);
    const result = evaluate(progress, null, curriculum);
    expect(result).toContain("perfect-week");
    expect(result).toContain("perfect-two-weeks");
  });

  it("is absent when a week has a day with no progress at all", () => {
    const { curriculum, progress } = perfectWeeksFixture(1, 1);
    delete (progress.days as Record<string, DayProgressState>)["day-2"];
    expect(evaluate(progress, null, curriculum)).not.toContain("perfect-week");
  });
});

describe("evaluateBadges — resilience badges (comeback-kid / iron-will / ten-and-done)", () => {
  /** A completed day that took real struggle: many wrongs, many attempts. */
  function toughDay(id: DayId, wrongCount: number, attemptCount: number): DayProgressState {
    return makeDayProgress(id, {
      isComplete: true,
      wrongCount,
      attempts: Array.from({ length: attemptCount }, (_, i) => ({
        exerciseId: `${id}-section-1-exercise-${i + 1}`,
        isCorrect: false,
      })),
    });
  }

  it("earns comeback-kid for one hard-won day", () => {
    const result = evaluate(makeProgress({ "day-1": toughDay("day-1", 5, 10) }));
    expect(result).toContain("comeback-kid");
    expect(result).not.toContain("iron-will");
  });

  it("is absent just below either threshold", () => {
    expect(evaluate(makeProgress({ "day-1": toughDay("day-1", 4, 10) }))).not.toContain(
      "comeback-kid",
    );
    expect(evaluate(makeProgress({ "day-1": toughDay("day-1", 5, 9) }))).not.toContain(
      "comeback-kid",
    );
  });

  it("earns iron-will at 3 hard-won days", () => {
    const result = evaluate(
      makeProgress({
        "day-1": toughDay("day-1", 5, 10),
        "day-2": toughDay("day-2", 6, 12),
        "day-3": toughDay("day-3", 5, 11),
      }),
    );
    expect(result).toContain("comeback-kid");
    expect(result).toContain("iron-will");
  });

  it("earns ten-and-done at 10 wrongs and 15 attempts", () => {
    expect(evaluate(makeProgress({ "day-1": toughDay("day-1", 10, 15) }))).toContain(
      "ten-and-done",
    );
  });

  it("is absent at 9 wrongs even with enough attempts", () => {
    expect(evaluate(makeProgress({ "day-1": toughDay("day-1", 9, 20) }))).not.toContain(
      "ten-and-done",
    );
  });

  it("does not count an incomplete day however hard it was", () => {
    const day = toughDay("day-1", 12, 20);
    day.isComplete = false;
    expect(evaluate(makeProgress({ "day-1": day }))).not.toContain("comeback-kid");
  });
});

describe("evaluateBadges — time-of-day badges", () => {
  it("earns early-bird when the first attempt was before 8am local time", () => {
    // Constructed in local time so the assertion does not depend on the TZ the
    // suite happens to run in.
    const at = new Date(2024, 2, 10, 6, 30).toISOString();
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          attempts: [{ exerciseId: "day-1-section-1-exercise-1", isCorrect: true, attemptedAt: at }],
        }),
      }),
    );
    expect(result).toContain("early-bird");
  });

  it("is absent when the first attempt was at 8am exactly (boundary)", () => {
    const at = new Date(2024, 2, 10, 8, 0).toISOString();
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          attempts: [{ exerciseId: "day-1-section-1-exercise-1", isCorrect: true, attemptedAt: at }],
        }),
      }),
    );
    expect(result).not.toContain("early-bird");
  });

  it("is absent for a day with no attempts", () => {
    const result = evaluate(
      makeProgress({ "day-1": makeDayProgress("day-1", { isComplete: true }) }),
    );
    expect(result).not.toContain("early-bird");
  });

  it.each([
    ["Friday", new Date(2024, 2, 8, 12, 0)],
    ["Saturday", new Date(2024, 2, 9, 12, 0)],
  ])("earns weekend-warrior for a day completed on %s", (_label, completed) => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          completedAt: completed.toISOString(),
        }),
      }),
    );
    expect(result).toContain("weekend-warrior");
  });

  it("is absent for a midweek completion", () => {
    const result = evaluate(
      makeProgress({
        "day-1": makeDayProgress("day-1", {
          isComplete: true,
          completedAt: new Date(2024, 2, 6, 12, 0).toISOString(), // Wednesday
        }),
      }),
    );
    expect(result).not.toContain("weekend-warrior");
  });

  it("is absent when completedAt is missing", () => {
    const result = evaluate(
      makeProgress({ "day-1": makeDayProgress("day-1", { isComplete: true }) }),
    );
    expect(result).not.toContain("weekend-warrior");
  });
});

describe("evaluateBadges — calendar streaks", () => {
  /** Completed days on the given ISO dates (one day each). */
  function daysOnDates(dates: string[]): WorkbookProgressState {
    const days: Record<string, DayProgressState> = {};
    dates.forEach((d, i) => {
      const id = `day-${i + 1}` as DayId;
      days[id] = makeDayProgress(id, { isComplete: true, completedAt: `${d}T10:00:00.000Z` });
    });
    return makeProgress(days);
  }

  it("earns calendar-streak-3 for three consecutive calendar days", () => {
    const result = evaluate(daysOnDates(["2024-03-11", "2024-03-12", "2024-03-13"]));
    expect(result).toContain("calendar-streak-3");
    expect(result).not.toContain("calendar-streak-7");
  });

  it("is absent when the run is broken by a gap", () => {
    const result = evaluate(daysOnDates(["2024-03-11", "2024-03-12", "2024-03-14"]));
    expect(result).not.toContain("calendar-streak-3");
  });

  it("measures the LONGEST run, not the most recent one", () => {
    // 4-day run, gap, then a single day. The trailing day must not reset it.
    const result = evaluate(
      daysOnDates([
        "2024-03-01",
        "2024-03-02",
        "2024-03-03",
        "2024-03-04",
        "2024-03-20",
      ]),
    );
    expect(result).toContain("calendar-streak-3");
  });

  it("earns calendar-streak-7 at seven consecutive days", () => {
    const dates = Array.from(
      { length: 7 },
      (_, i) => `2024-03-${String(i + 11).padStart(2, "0")}`,
    );
    const result = evaluate(daysOnDates(dates));
    expect(result).toContain("calendar-streak-3");
    expect(result).toContain("calendar-streak-7");
  });

  it("collapses several days completed on the same date to one streak day", () => {
    const result = evaluate(
      daysOnDates(["2024-03-11", "2024-03-11", "2024-03-11", "2024-03-12"]),
    );
    expect(result).not.toContain("calendar-streak-3");
  });
});

describe("evaluateBadges — halfway-there", () => {
  it("earns halfway-there at half the content days, excluding the exam day", () => {
    // 4 content days + day-29 (exam) => ceil(4/2) = 2 completions needed.
    const curriculum = [
      makeWorkbookDay("day-1"),
      makeWorkbookDay("day-2"),
      makeWorkbookDay("day-3"),
      makeWorkbookDay("day-4"),
      makeWorkbookDay("day-29"),
    ];
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", { isComplete: true }),
      "day-2": makeDayProgress("day-2", { isComplete: true }),
    });
    expect(evaluate(progress, null, curriculum)).toContain("halfway-there");
  });

  it("is absent one completion short", () => {
    const curriculum = [
      makeWorkbookDay("day-1"),
      makeWorkbookDay("day-2"),
      makeWorkbookDay("day-3"),
      makeWorkbookDay("day-4"),
    ];
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", { isComplete: true }),
    });
    expect(evaluate(progress, null, curriculum)).not.toContain("halfway-there");
  });
});

describe("evaluateBadges — graduation badges", () => {
  const curriculum = [
    makeWorkbookDay("day-1"),
    makeWorkbookDay("day-2"),
    makeWorkbookDay("day-29"), // exam day, excluded from the "all days" requirement
  ];

  const allContentDone = makeProgress({
    "day-1": makeDayProgress("day-1", { isComplete: true }),
    "day-2": makeDayProgress("day-2", { isComplete: true }),
  });

  it("earns grade-a-graduate with all content days done and the exam passed", () => {
    const result = evaluateBadges({
      progress: allContentDone,
      finalExam: makeFinalExam({ passed: true }),
      curriculum,
      grade: "a",
    });
    expect(result).toContain("grade-a-graduate");
    expect(result).not.toContain("grade-b-graduate");
  });

  it("does not earn grade-a-graduate when the exam was not passed", () => {
    const result = evaluateBadges({
      progress: allContentDone,
      finalExam: makeFinalExam({ passed: false }),
      curriculum,
      grade: "a",
    });
    expect(result).not.toContain("grade-a-graduate");
  });

  it("does not earn grade-a-graduate when a content day is missing", () => {
    const result = evaluateBadges({
      progress: makeProgress({ "day-1": makeDayProgress("day-1", { isComplete: true }) }),
      finalExam: makeFinalExam({ passed: true }),
      curriculum,
      grade: "a",
    });
    expect(result).not.toContain("grade-a-graduate");
  });

  it("earns grade-b-graduate on grade b, and never the grade-a one", () => {
    const result = evaluateBadges({
      progress: allContentDone,
      finalExam: makeFinalExam({ grade: "b", passed: true }),
      curriculum,
      grade: "b",
    });
    expect(result).toContain("grade-b-graduate");
    expect(result).not.toContain("grade-a-graduate");
  });

  it("does not earn grade-b-graduate without a passed exam", () => {
    const result = evaluateBadges({
      progress: allContentDone,
      finalExam: null,
      curriculum,
      grade: "b",
    });
    expect(result).not.toContain("grade-b-graduate");
  });
});

describe("evaluateBadges — grand-master", () => {
  const curriculum = [makeWorkbookDay("day-1"), makeWorkbookDay("day-2"), makeWorkbookDay("day-29")];

  function perfect(id: DayId): DayProgressState {
    return makeDayProgress(id, {
      isComplete: true,
      attempts: [{ exerciseId: `${id}-section-1-exercise-1`, isCorrect: true }],
    });
  }

  it("earns grand-master when every content day is first-attempt perfect", () => {
    const progress = makeProgress({ "day-1": perfect("day-1"), "day-2": perfect("day-2") });
    expect(evaluate(progress, null, curriculum)).toContain("grand-master");
  });

  it("is absent when one day was merely completed, not perfect", () => {
    const progress = makeProgress({
      "day-1": perfect("day-1"),
      "day-2": makeDayProgress("day-2", {
        isComplete: true,
        attempts: [{ exerciseId: "day-2-section-1-exercise-1", isCorrect: false }],
      }),
    });
    expect(evaluate(progress, null, curriculum)).not.toContain("grand-master");
  });

  it("is absent when a content day has no progress entry", () => {
    const progress = makeProgress({ "day-1": perfect("day-1") });
    expect(evaluate(progress, null, curriculum)).not.toContain("grand-master");
  });

  it("cannot be triggered by legacy data with wrongCount 0 but no attempts", () => {
    // The guard that makes attempts[] authoritative rather than wrongCount.
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", { isComplete: true, wrongCount: 0 }),
      "day-2": makeDayProgress("day-2", { isComplete: true, wrongCount: 0 }),
    });
    expect(evaluate(progress, null, curriculum)).not.toContain("grand-master");
  });
});

describe("evaluateBadges — ministry strand badges", () => {
  // Strand membership comes from the real curriculum plan, so this drives the
  // engine with the actual grade-a strands rather than a fixture.
  const strands = getMinistryStrandsForGrade("a");

  function completeStrand(strandId: string): WorkbookProgressState {
    const strand = strands.find((s) => s.id === strandId);
    const days: Record<string, DayProgressState> = {};
    for (const n of strand?.dayNumbers ?? []) {
      days[`day-${n}`] = makeDayProgress(`day-${n}` as DayId, { isComplete: true });
    }
    return makeProgress(days);
  }

  it("covers every strand the grade-a plan defines", () => {
    // Guard against this suite silently testing a subset: if a strand is added
    // to the plan, the mapping below must gain a case too.
    expect(strands.map((s) => s.id).sort()).toEqual([
      "measurement-geometry",
      "natural-numbers",
      "operations",
      "supplementary-pedagogy",
    ]);
  });

  it.each([
    ["natural-numbers", "strand-numbers"],
    ["operations", "strand-operations"],
    ["measurement-geometry", "strand-geometry"],
    ["supplementary-pedagogy", "strand-advanced"],
  ])("earns %s -> %s when every day of the strand is complete", (strandId, badgeId) => {
    const strand = strands.find((s) => s.id === strandId);
    // Guard: if the curriculum plan drops this strand, fail loudly rather than
    // passing a test that no longer asserts anything.
    expect(strand, `strand ${strandId} missing from the grade-a plan`).toBeDefined();
    expect(evaluate(completeStrand(strandId))).toContain(badgeId);
  });

  it("does not earn a strand badge when one of its days is incomplete", () => {
    const strand = strands.find((s) => s.id === "natural-numbers");
    expect(strand).toBeDefined();
    const progress = completeStrand("natural-numbers");
    const firstDay = `day-${strand!.dayNumbers[0]}`;
    delete (progress.days as Record<string, DayProgressState>)[firstDay];
    expect(evaluate(progress)).not.toContain("strand-numbers");
  });
});
