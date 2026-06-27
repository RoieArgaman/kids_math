import { describe, expect, it } from "vitest";
import type {
  DayId,
  DayProgressState,
  Exercise,
  ExerciseAttempt,
  ExerciseId,
  SectionId,
  SkillTag,
  WorkbookDay,
  WorkbookProgressState,
} from "@/lib/types";
import { selectReviewItems } from "@/lib/review/select";
import { recordReview } from "@/lib/review/engine";
import { createInitialReviewState } from "@/lib/review/storage";
import type { ReviewState } from "@/lib/review/types";

const NOW = "2024-02-01T00:00:00.000Z";

// ---- fixture builders -------------------------------------------------------

function exercise(id: ExerciseId, skillTags: SkillTag[] = ["addition"]): Exercise {
  return {
    id,
    kind: "number_input",
    prompt: "1 + 1 = ?",
    answer: 2,
    meta: { skillTags, difficulty: 1, representation: "abstract" },
  };
}

/** Build a WorkbookDay with one section holding the given exercises. */
function day(dayId: DayId, exercises: Exercise[]): WorkbookDay {
  const sectionId: SectionId = `${dayId}-section-1`;
  return {
    id: dayId,
    dayNumber: 1,
    title: "יום",
    week: 1,
    objective: "obj",
    spiralReviewTags: [],
    unlockThresholdPercent: 100,
    sections: [
      {
        id: sectionId,
        title: "סעיף",
        type: "arithmetic",
        learningGoal: "goal",
        prerequisiteSkillTags: [],
        exercises,
      },
    ],
  };
}

function attempt(
  exerciseId: ExerciseId,
  isCorrect: boolean,
  attemptedAt: string,
): ExerciseAttempt {
  return { exerciseId, answer: 1, isCorrect, attemptedAt };
}

/** A DayProgressState carrying a flat attempts list (correctAnswers left empty on purpose). */
function dayProgress(dayId: DayId, attempts: ExerciseAttempt[]): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    wrongBySection: {},
    attempts,
    percentDone: 0,
    isComplete: false,
  };
}

function progressOf(...days: DayProgressState[]): WorkbookProgressState {
  const map: Record<DayId, DayProgressState> = {};
  for (const d of days) map[d.dayId] = d;
  return { version: 1, days: map, updatedAt: NOW };
}

function emptyReview(): ReviewState {
  return createInitialReviewState(NOW);
}

// ---- tests ------------------------------------------------------------------

describe("selectReviewItems — candidate rule", () => {
  it("selects an exercise whose FIRST attempt was wrong, even if a later attempt is correct", () => {
    const ex: ExerciseId = "day-1-section-1-exercise-1";
    const daysById = { "day-1": day("day-1", [exercise(ex)]) };
    const progress = progressOf(
      dayProgress("day-1", [
        attempt(ex, false, "2024-01-01T00:00:00.000Z"),
        attempt(ex, true, "2024-01-01T00:01:00.000Z"),
      ]),
    );

    const result = selectReviewItems({
      progress,
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([ex]);
    expect(result[0]?.incorrectAttempts).toBe(1);
  });

  it("does NOT select an exercise whose first attempt was correct", () => {
    const ex: ExerciseId = "day-1-section-1-exercise-1";
    const daysById = { "day-1": day("day-1", [exercise(ex)]) };
    const progress = progressOf(
      dayProgress("day-1", [
        attempt(ex, true, "2024-01-01T00:00:00.000Z"),
        attempt(ex, false, "2024-01-01T00:01:00.000Z"),
      ]),
    );

    const result = selectReviewItems({
      progress,
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result).toEqual([]);
  });

  it("ignores correctAnswers entirely — selection works off attempts[] only", () => {
    const ex: ExerciseId = "day-1-section-1-exercise-1";
    const daysById = { "day-1": day("day-1", [exercise(ex)]) };
    const base = dayProgress("day-1", [attempt(ex, false, "2024-01-01T00:00:00.000Z")]);
    // correctAnswers claims success; attempts say first attempt was wrong → still selected.
    const withCorrectFlag: DayProgressState = {
      ...base,
      correctAnswers: { [ex]: true },
    };
    const result = selectReviewItems({
      progress: progressOf(withCorrectFlag),
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([ex]);
  });

  it("excludes items from excludeDayId", () => {
    const exA: ExerciseId = "day-1-section-1-exercise-1";
    const exB: ExerciseId = "day-2-section-1-exercise-1";
    const daysById = {
      "day-1": day("day-1", [exercise(exA)]),
      "day-2": day("day-2", [exercise(exB)]),
    };
    const progress = progressOf(
      dayProgress("day-1", [attempt(exA, false, "2024-01-01T00:00:00.000Z")]),
      dayProgress("day-2", [attempt(exB, false, "2024-01-01T00:00:00.000Z")]),
    );
    const result = selectReviewItems({
      progress,
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-1",
      max: 4,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([exB]);
  });

  it("skips attempts whose exerciseId is absent from daysById (content drift, no throw)", () => {
    const present: ExerciseId = "day-1-section-1-exercise-1";
    const ghost: ExerciseId = "day-9-section-1-exercise-9";
    const daysById = { "day-1": day("day-1", [exercise(present)]) };
    const progress = progressOf(
      dayProgress("day-1", [
        attempt(present, false, "2024-01-01T00:00:00.000Z"),
        attempt(ghost, false, "2024-01-01T00:00:00.000Z"),
      ]),
    );
    const result = selectReviewItems({
      progress,
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([present]);
  });

  it("returns [] for empty progress", () => {
    const result = selectReviewItems({
      progress: progressOf(),
      daysById: {},
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result).toEqual([]);
  });
});

describe("selectReviewItems — capping, ranking, spread", () => {
  it("respects the max cap", () => {
    const exercises = [1, 2, 3, 4, 5].map((n) =>
      exercise(
        `day-1-section-1-exercise-${n}` as ExerciseId,
        // distinct primary skills so spread does not collapse them
        [(["addition", "subtraction", "comparing", "counting", "patterns"] as SkillTag[])[n - 1]!],
      ),
    );
    const daysById = { "day-1": day("day-1", exercises) };
    const attempts = exercises.map((e, i) =>
      attempt(e.id, false, `2024-01-0${i + 1}T00:00:00.000Z`),
    );
    const result = selectReviewItems({
      progress: progressOf(dayProgress("day-1", attempts)),
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 2,
    });
    expect(result).toHaveLength(2);
  });

  it("diversifies primary skill tags before repeating a skill", () => {
    // Three "addition" candidates + one "subtraction"; with max 2 the spread must
    // surface the subtraction item rather than two addition items.
    const add1: ExerciseId = "day-1-section-1-exercise-1";
    const add2: ExerciseId = "day-1-section-1-exercise-2";
    const add3: ExerciseId = "day-1-section-1-exercise-3";
    const sub1: ExerciseId = "day-1-section-1-exercise-4";
    const daysById = {
      "day-1": day("day-1", [
        exercise(add1, ["addition"]),
        exercise(add2, ["addition"]),
        exercise(add3, ["addition"]),
        exercise(sub1, ["subtraction"]),
      ]),
    };
    const progress = progressOf(
      dayProgress("day-1", [
        attempt(add1, false, "2024-01-01T00:00:00.000Z"),
        attempt(add2, false, "2024-01-02T00:00:00.000Z"),
        attempt(add3, false, "2024-01-03T00:00:00.000Z"),
        attempt(sub1, false, "2024-01-01T00:00:00.000Z"),
      ]),
    );
    const result = selectReviewItems({
      progress,
      daysById,
      reviewState: emptyReview(),
      now: NOW,
      excludeDayId: "day-99",
      max: 2,
    });
    const skills = result.map((c) => c.skillTags[0]);
    expect(skills).toContain("addition");
    expect(skills).toContain("subtraction");
    expect(new Set(skills).size).toBe(2);
  });

  it("ranks an exercise with more incorrect attempts earlier (equal due time tiebreak)", () => {
    // The incorrectAttempts tiebreak only fires when the due-ordering is a tie, so
    // give both items a review item with the SAME (already-due) dueAt.
    const few: ExerciseId = "day-1-section-1-exercise-1";
    const many: ExerciseId = "day-1-section-1-exercise-2";
    const daysById = {
      "day-1": day("day-1", [
        exercise(few, ["addition"]),
        exercise(many, ["addition"]),
      ]),
    };
    const progress = progressOf(
      dayProgress("day-1", [
        attempt(few, false, "2024-01-01T00:00:00.000Z"),
        attempt(few, true, "2024-01-01T00:05:00.000Z"),
        attempt(many, false, "2024-01-01T00:00:00.000Z"),
        attempt(many, false, "2024-01-01T00:01:00.000Z"),
        attempt(many, false, "2024-01-01T00:02:00.000Z"),
      ]),
    );
    const dueAt = "2024-01-15T00:00:00.000Z"; // past relative to NOW → both due
    const reviewState: ReviewState = {
      ...createInitialReviewState(NOW),
      items: {
        [few]: {
          exerciseId: few,
          box: 1,
          dueAt,
          lastReviewedAt: "2024-01-12T00:00:00.000Z",
          timesSeen: 1,
          timesCorrect: 0,
        },
        [many]: {
          exerciseId: many,
          box: 1,
          dueAt,
          lastReviewedAt: "2024-01-12T00:00:00.000Z",
          timesSeen: 1,
          timesCorrect: 0,
        },
      },
    };
    const result = selectReviewItems({
      progress,
      daysById,
      reviewState,
      now: NOW,
      excludeDayId: "day-99",
      // max 2 but same primary skill → spread fills the second slot from ranking
      max: 2,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([many, few]);
    expect(result[0]?.incorrectAttempts).toBe(3);
  });
});

describe("selectReviewItems — review-state overlay (Leitner)", () => {
  const ex: ExerciseId = "day-1-section-1-exercise-1";
  const daysById = { "day-1": day("day-1", [exercise(ex)]) };
  const progress = () =>
    progressOf(dayProgress("day-1", [attempt(ex, false, "2024-01-01T00:00:00.000Z")]));

  it("excludes a graduated (box 5) review item", () => {
    // Drive a fresh item up to box 5 via correct reviews.
    let rs = createInitialReviewState("2024-01-01T00:00:00.000Z");
    for (let i = 0; i < 5; i++) {
      rs = recordReview(rs, ex, true, "2024-01-01T00:00:00.000Z");
    }
    expect(rs.items[ex]?.box).toBe(5);

    const result = selectReviewItems({
      progress: progress(),
      daysById,
      reviewState: rs,
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result).toEqual([]);
  });

  it("excludes an active item that is not yet due", () => {
    const rs: ReviewState = {
      ...createInitialReviewState(NOW),
      items: {
        [ex]: {
          exerciseId: ex,
          box: 2,
          dueAt: "2024-03-01T00:00:00.000Z", // future
          lastReviewedAt: "2024-01-20T00:00:00.000Z",
          timesSeen: 1,
          timesCorrect: 1,
        },
      },
    };
    const result = selectReviewItems({
      progress: progress(),
      daysById,
      reviewState: rs,
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result).toEqual([]);
  });

  it("includes an active item that is due", () => {
    const rs: ReviewState = {
      ...createInitialReviewState(NOW),
      items: {
        [ex]: {
          exerciseId: ex,
          box: 2,
          dueAt: "2024-01-15T00:00:00.000Z", // past relative to NOW
          lastReviewedAt: "2024-01-12T00:00:00.000Z",
          timesSeen: 1,
          timesCorrect: 1,
        },
      },
    };
    const result = selectReviewItems({
      progress: progress(),
      daysById,
      reviewState: rs,
      now: NOW,
      excludeDayId: "day-99",
      max: 4,
    });
    expect(result.map((c) => c.exercise.id)).toEqual([ex]);
    expect(result[0]?.reviewItem?.box).toBe(2);
  });
});
