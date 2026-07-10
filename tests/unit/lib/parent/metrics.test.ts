import { describe, expect, it } from "vitest";
import type { GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import type {
  DayProgressState,
  ExerciseAttempt,
  ExerciseId,
  NumberInputExercise,
  Section,
  SectionId,
  SkillTag,
  WorkbookDay,
  WorkbookProgressState,
} from "@/lib/types";
import type { ReviewBox, ReviewItemState, ReviewState } from "@/lib/review/types";
import type { StreakState } from "@/lib/streak/types";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import {
  IDLE_CLAMP_MS,
  WEAK_SKILL_MIN_SEEN,
  TIME_ON_TASK_WINDOW_MS,
  type ExamInput,
  type ReviewInput,
  type TrackInput,
  deriveAllMetrics,
  deriveDaysAndSections,
  deriveDaysAndSectionsByGrade,
  deriveExamResults,
  deriveFirstAttemptAccuracy,
  deriveLastActiveIso,
  deriveReviewBacklog,
  deriveStreak,
  deriveTimeOnTask,
  deriveWeakSkills,
} from "@/lib/parent/metrics";

// ----------------------------------------------------------------------------
// Fixture factories — minimal, fully typed, deterministic.
// ----------------------------------------------------------------------------

const NOW = Date.parse("2024-06-15T12:00:00.000Z");

function makeExercise(id: ExerciseId, skillTags: SkillTag[] = []): NumberInputExercise {
  return {
    id,
    kind: "number_input",
    prompt: "1 + 1 = ?",
    answer: 2,
    meta: { skillTags, difficulty: 1, representation: "abstract" },
  };
}

function makeSection(id: SectionId, exercises: NumberInputExercise[]): Section {
  return {
    id,
    title: "section",
    type: "arithmetic",
    learningGoal: "goal",
    prerequisiteSkillTags: [],
    exercises,
  };
}

function makeDay(id: WorkbookDay["id"], sections: Section[]): WorkbookDay {
  return {
    id,
    dayNumber: 1,
    title: "day",
    week: 1,
    objective: "objective",
    spiralReviewTags: [],
    unlockThresholdPercent: 80,
    sections,
  };
}

function makeAttempt(
  exerciseId: ExerciseId,
  isCorrect: boolean,
  attemptedAt: string,
): ExerciseAttempt {
  return { exerciseId, answer: isCorrect ? 2 : 0, isCorrect, attemptedAt };
}

function makeDayProgress(
  dayId: WorkbookDay["id"],
  opts: {
    attempts?: ExerciseAttempt[];
    correctAnswers?: Record<ExerciseId, boolean>;
    isComplete?: boolean;
    bestTimeMs?: number;
  } = {},
): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: opts.correctAnswers ?? {},
    wrongCount: 0,
    wrongBySection: {},
    attempts: opts.attempts ?? [],
    bestTimeMs: opts.bestTimeMs,
    percentDone: 0,
    isComplete: opts.isComplete ?? false,
  };
}

function makeProgress(days: Record<string, DayProgressState>): WorkbookProgressState {
  return { version: 1, days, updatedAt: "2024-06-15T00:00:00.000Z" };
}

function makeTrackInput(
  subject: Subject,
  grade: GradeId,
  progress: WorkbookProgressState,
  days: WorkbookDay[],
): TrackInput {
  return { key: { subject, grade }, progress, days };
}

function makeReviewItem(
  exerciseId: ExerciseId,
  box: ReviewBox,
  dueAt: string,
): ReviewItemState {
  return {
    exerciseId,
    box,
    dueAt,
    lastReviewedAt: dueAt,
    timesSeen: 1,
    timesCorrect: 0,
  };
}

function makeReviewInput(
  subject: Subject,
  grade: GradeId,
  items: Record<ExerciseId, ReviewItemState>,
): ReviewInput {
  const state: ReviewState = { version: 1, items, updatedAt: "2024-06-15T00:00:00.000Z" };
  return { key: { subject, grade }, state };
}

// Fixed exercise ids used across tests.
const EX1: ExerciseId = "day-1-section-1-exercise-1";
const EX2: ExerciseId = "day-1-section-1-exercise-2";
const EX3: ExerciseId = "day-1-section-1-exercise-3";

// ----------------------------------------------------------------------------
// deriveFirstAttemptAccuracy
// ----------------------------------------------------------------------------

describe("deriveFirstAttemptAccuracy", () => {
  it("inflation guard: counts the FIRST attempt even when later correct", () => {
    // One exercise, attempts = [wrong, then correct], correctAnswers ever-true.
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [
          makeAttempt(EX1, false, "2024-06-15T10:00:00.000Z"),
          makeAttempt(EX1, true, "2024-06-15T10:01:00.000Z"),
        ],
        correctAnswers: { [EX1]: true },
      }),
    });
    const tracks = [makeTrackInput("math", "a", progress, [day])];

    const vm = deriveFirstAttemptAccuracy(tracks);
    // Naive "ever correct" would give 100; first-attempt-wrong must give 0.
    expect(vm.overall).toBe(0);
    expect(vm.bySubject.math).toBe(0);
  });

  it("populates the per-subject breakdown", () => {
    const mathDay = makeDay("day-1", [
      makeSection("day-1-section-1", [makeExercise(EX1), makeExercise(EX2)]),
    ]);
    const mathProgress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [
          makeAttempt(EX1, true, "2024-06-15T10:00:00.000Z"),
          makeAttempt(EX2, false, "2024-06-15T10:01:00.000Z"),
        ],
      }),
    });
    const engDay = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const engProgress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, "2024-06-15T11:00:00.000Z")],
      }),
    });
    const tracks = [
      makeTrackInput("math", "a", mathProgress, [mathDay]),
      makeTrackInput("english", "a", engProgress, [engDay]),
    ];

    const vm = deriveFirstAttemptAccuracy(tracks);
    expect(vm.bySubject.math).toBe(50); // 1 of 2
    expect(vm.bySubject.english).toBe(100); // 1 of 1
    expect(vm.overall).toBe(67); // 2 of 3 rounded
  });

  it("returns overall null when there are no attempts", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const tracks = [makeTrackInput("math", "a", makeProgress({}), [day])];
    expect(deriveFirstAttemptAccuracy(tracks).overall).toBeNull();
  });
});

// ----------------------------------------------------------------------------
// deriveDaysAndSections
// ----------------------------------------------------------------------------

describe("deriveDaysAndSections", () => {
  it("counts complete days and excludes the final-exam pseudo-day", () => {
    const realDay = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const examDay = makeDay(FINAL_EXAM_DAY_ID, [
      makeSection(`${FINAL_EXAM_DAY_ID}-section-1`, [
        makeExercise(`${FINAL_EXAM_DAY_ID}-section-1-exercise-1`),
      ]),
    ]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", { isComplete: true }),
      [FINAL_EXAM_DAY_ID]: makeDayProgress(FINAL_EXAM_DAY_ID, { isComplete: true }),
    });
    const tracks = [makeTrackInput("math", "a", progress, [realDay, examDay])];

    const vm = deriveDaysAndSections(tracks);
    // Only the real day counts; exam day is excluded from both totals and complete.
    expect(vm.totalDays).toBe(1);
    expect(vm.daysComplete).toBe(1);
    expect(vm.totalSections).toBe(1);
  });

  it("marks a section complete only when ALL its exercises are correctAnswers===true", () => {
    const day = makeDay("day-1", [
      makeSection("day-1-section-1", [makeExercise(EX1), makeExercise(EX2)]),
    ]);
    // Only one of two exercises correct → section NOT complete.
    const partialProgress = makeProgress({
      "day-1": makeDayProgress("day-1", { correctAnswers: { [EX1]: true } }),
    });
    const partial = deriveDaysAndSections([
      makeTrackInput("math", "a", partialProgress, [day]),
    ]);
    expect(partial.totalSections).toBe(1);
    expect(partial.sectionsComplete).toBe(0);

    // Both exercises correct → section complete.
    const fullProgress = makeProgress({
      "day-1": makeDayProgress("day-1", { correctAnswers: { [EX1]: true, [EX2]: true } }),
    });
    const full = deriveDaysAndSections([makeTrackInput("math", "a", fullProgress, [day])]);
    expect(full.sectionsComplete).toBe(1);
  });
});

// ----------------------------------------------------------------------------
// deriveDaysAndSectionsByGrade (grade-first rollup)
// ----------------------------------------------------------------------------

describe("deriveDaysAndSectionsByGrade", () => {
  it("splits days/sections by the grade axis", () => {
    const dayA = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const dayB = makeDay("day-2", [makeSection("day-2-section-1", [makeExercise(EX2)])]);
    const progA = makeProgress({ "day-1": makeDayProgress("day-1", { isComplete: true }) });
    const progB = makeProgress({ "day-2": makeDayProgress("day-2", { isComplete: false }) });
    const tracks = [
      makeTrackInput("math", "a", progA, [dayA]),
      makeTrackInput("math", "b", progB, [dayB]),
    ];

    const byGrade = deriveDaysAndSectionsByGrade(tracks);
    expect(byGrade.a.totalDays).toBe(1);
    expect(byGrade.a.daysComplete).toBe(1);
    expect(byGrade.b.totalDays).toBe(1);
    expect(byGrade.b.daysComplete).toBe(0);
  });

  it("agrees with the global rollup when summed across grades", () => {
    const dayA = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const dayB = makeDay("day-2", [makeSection("day-2-section-1", [makeExercise(EX2)])]);
    const tracks = [
      makeTrackInput("math", "a", makeProgress({ "day-1": makeDayProgress("day-1", { isComplete: true }) }), [dayA]),
      makeTrackInput("science", "b", makeProgress({ "day-2": makeDayProgress("day-2", { isComplete: true }) }), [dayB]),
    ];
    const global = deriveDaysAndSections(tracks);
    const byGrade = deriveDaysAndSectionsByGrade(tracks);
    expect(byGrade.a.totalDays + byGrade.b.totalDays).toBe(global.totalDays);
    expect(byGrade.a.daysComplete + byGrade.b.daysComplete).toBe(global.daysComplete);
  });
});

describe("deriveExamResults ordering", () => {
  it("orders grade-first (A before B), then by subject", () => {
    const exams: ExamInput[] = [
      { key: { subject: "science", grade: "b" }, passed: true, scorePercent: 90, submittedAt: null },
      { key: { subject: "math", grade: "b" }, passed: true, scorePercent: 88, submittedAt: null },
      { key: { subject: "english", grade: "a" }, passed: true, scorePercent: 95, submittedAt: null },
      { key: { subject: "math", grade: "a" }, passed: false, scorePercent: 50, submittedAt: null },
    ];
    const ordered = deriveExamResults(exams).map((e) => `${e.key.grade}:${e.key.subject}`);
    expect(ordered).toEqual(["a:math", "a:english", "b:math", "b:science"]);
  });
});

// ----------------------------------------------------------------------------
// deriveTimeOnTask
// ----------------------------------------------------------------------------

describe("deriveTimeOnTask", () => {
  it("sums the gap between two attempts 2 minutes apart (within window)", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const t0 = new Date(NOW - 10 * 60 * 1000).toISOString();
    const t1 = new Date(NOW - 8 * 60 * 1000).toISOString(); // +2 min
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, t0), makeAttempt(EX2, true, t1)],
      }),
    });
    const vm = deriveTimeOnTask([makeTrackInput("math", "a", progress, [day])], NOW);
    expect(vm.approxWeeklyMs).toBe(120000);
  });

  it("clamps a 30-minute gap to IDLE_CLAMP_MS", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const t0 = new Date(NOW - 40 * 60 * 1000).toISOString();
    const t1 = new Date(NOW - 10 * 60 * 1000).toISOString(); // +30 min
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, t0), makeAttempt(EX2, true, t1)],
      }),
    });
    const vm = deriveTimeOnTask([makeTrackInput("math", "a", progress, [day])], NOW);
    expect(vm.approxWeeklyMs).toBe(IDLE_CLAMP_MS);
    expect(IDLE_CLAMP_MS).toBe(300000);
  });

  it("contributes 0 for a day with a single attempt", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, new Date(NOW - 60 * 1000).toISOString())],
      }),
    });
    const vm = deriveTimeOnTask([makeTrackInput("math", "a", progress, [day])], NOW);
    expect(vm.approxWeeklyMs).toBe(0);
  });

  it("excludes attempts older than the 7-day window", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const old0 = new Date(NOW - TIME_ON_TASK_WINDOW_MS - 4 * 60 * 1000).toISOString();
    const old1 = new Date(NOW - TIME_ON_TASK_WINDOW_MS - 2 * 60 * 1000).toISOString();
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, old0), makeAttempt(EX2, true, old1)],
      }),
    });
    const vm = deriveTimeOnTask([makeTrackInput("math", "a", progress, [day])], NOW);
    expect(vm.approxWeeklyMs).toBe(0);
  });
});

// ----------------------------------------------------------------------------
// deriveWeakSkills
// ----------------------------------------------------------------------------

describe("deriveWeakSkills", () => {
  it("excludes a skill seen fewer than WEAK_SKILL_MIN_SEEN times", () => {
    expect(WEAK_SKILL_MIN_SEEN).toBe(3);
    const day = makeDay("day-1", [
      makeSection("day-1-section-1", [
        makeExercise(EX1, ["subtraction"]),
        makeExercise(EX2, ["subtraction"]),
      ]),
    ]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [
          makeAttempt(EX1, false, "2024-06-15T10:00:00.000Z"),
          makeAttempt(EX2, false, "2024-06-15T10:01:00.000Z"),
        ],
      }),
    });
    const weak = deriveWeakSkills([makeTrackInput("math", "a", progress, [day])]);
    expect(weak).toHaveLength(0); // only 2 first-attempts → below threshold
  });

  it("ranks a shaky skill (seen>=3 with some wrong) worst-first, with Hebrew label", () => {
    const day = makeDay("day-1", [
      makeSection("day-1-section-1", [
        // subtraction: 3 seen, 2 wrong → wrongRate 2/3
        makeExercise(EX1, ["subtraction"]),
        makeExercise(EX2, ["subtraction"]),
        makeExercise(EX3, ["subtraction"]),
        // addition: 3 seen, 1 wrong → wrongRate 1/3
        makeExercise("day-1-section-1-exercise-4", ["addition"]),
        makeExercise("day-1-section-1-exercise-5", ["addition"]),
        makeExercise("day-1-section-1-exercise-6", ["addition"]),
      ]),
    ]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [
          makeAttempt(EX1, false, "2024-06-15T10:00:00.000Z"),
          makeAttempt(EX2, false, "2024-06-15T10:01:00.000Z"),
          makeAttempt(EX3, true, "2024-06-15T10:02:00.000Z"),
          makeAttempt("day-1-section-1-exercise-4", false, "2024-06-15T10:03:00.000Z"),
          makeAttempt("day-1-section-1-exercise-5", true, "2024-06-15T10:04:00.000Z"),
          makeAttempt("day-1-section-1-exercise-6", true, "2024-06-15T10:05:00.000Z"),
        ],
      }),
    });
    const weak = deriveWeakSkills([makeTrackInput("math", "a", progress, [day])]);
    expect(weak).toHaveLength(2);
    // subtraction (2/3) ranked before addition (1/3).
    expect(weak[0].tag).toBe("subtraction");
    expect(weak[0].wrongRate).toBeCloseTo(2 / 3);
    expect(weak[0].seen).toBe(3);
    expect(weak[0].wrong).toBe(2);
    expect(weak[0].label).toBe("חיסור");
    expect(weak[0].label.length).toBeGreaterThan(0);
    expect(weak[1].tag).toBe("addition");
    expect(weak[1].wrongRate).toBeCloseTo(1 / 3);
  });

  it("excludes a skill seen>=3 with zero wrong (only shaky skills surface)", () => {
    const day = makeDay("day-1", [
      makeSection("day-1-section-1", [
        makeExercise(EX1, ["addition"]),
        makeExercise(EX2, ["addition"]),
        makeExercise(EX3, ["addition"]),
      ]),
    ]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [
          makeAttempt(EX1, true, "2024-06-15T10:00:00.000Z"),
          makeAttempt(EX2, true, "2024-06-15T10:01:00.000Z"),
          makeAttempt(EX3, true, "2024-06-15T10:02:00.000Z"),
        ],
      }),
    });
    const weak = deriveWeakSkills([makeTrackInput("math", "a", progress, [day])]);
    expect(weak).toHaveLength(0);
  });
});

// ----------------------------------------------------------------------------
// deriveReviewBacklog
// ----------------------------------------------------------------------------

describe("deriveReviewBacklog", () => {
  it("buckets box 5 as mastered, due/practicing by dueAt vs now", () => {
    const past = new Date(NOW - 60 * 1000).toISOString();
    const future = new Date(NOW + 60 * 1000).toISOString();
    const reviews = [
      makeReviewInput("math", "a", {
        [EX1]: makeReviewItem(EX1, 5, past), // mastered (box 5 regardless of dueAt)
        [EX2]: makeReviewItem(EX2, 2, past), // due (box 1-4, dueAt <= now)
        [EX3]: makeReviewItem(EX3, 3, future), // practicing (box 1-4, dueAt > now)
      }),
    ];
    const vm = deriveReviewBacklog(reviews, NOW);
    expect(vm.mastered).toBe(1);
    expect(vm.due).toBe(1);
    expect(vm.practicing).toBe(1);
  });
});

// ----------------------------------------------------------------------------
// deriveStreak
// ----------------------------------------------------------------------------

describe("deriveStreak", () => {
  it("returns zeros for null", () => {
    expect(deriveStreak(null)).toEqual({ current: 0, longest: 0 });
  });

  it("reads currentStreak/longestStreak from a state", () => {
    const state: StreakState = {
      version: 1,
      lastActiveDate: "2024-06-15",
      currentStreak: 4,
      longestStreak: 9,
      earnedBadges: [],
      updatedAt: "2024-06-15T00:00:00.000Z",
    };
    expect(deriveStreak(state)).toEqual({ current: 4, longest: 9 });
  });
});

// ----------------------------------------------------------------------------
// deriveLastActiveIso
// ----------------------------------------------------------------------------

describe("deriveLastActiveIso", () => {
  it("returns the latest attemptedAt across tracks", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const early = "2024-06-15T10:00:00.000Z";
    const latest = "2024-06-15T11:30:00.000Z";
    const t1 = makeProgress({
      "day-1": makeDayProgress("day-1", { attempts: [makeAttempt(EX1, true, early)] }),
    });
    const t2 = makeProgress({
      "day-1": makeDayProgress("day-1", { attempts: [makeAttempt(EX1, true, latest)] }),
    });
    const iso = deriveLastActiveIso([
      makeTrackInput("math", "a", t1, [day]),
      makeTrackInput("english", "a", t2, [day]),
    ]);
    expect(iso).toBe(latest);
  });

  it("returns null when there are no attempts", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const iso = deriveLastActiveIso([makeTrackInput("math", "a", makeProgress({}), [day])]);
    expect(iso).toBeNull();
  });
});

// ----------------------------------------------------------------------------
// deriveAllMetrics — smoke test
// ----------------------------------------------------------------------------

describe("deriveAllMetrics", () => {
  it("wires everything and reports hasAnyData=true when an attempt exists", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const progress = makeProgress({
      "day-1": makeDayProgress("day-1", {
        attempts: [makeAttempt(EX1, true, "2024-06-15T10:00:00.000Z")],
        isComplete: true,
      }),
    });
    const exams: ExamInput[] = [
      { key: { subject: "math", grade: "a" }, passed: true, scorePercent: 90, submittedAt: null },
    ];
    const vm = deriveAllMetrics({
      tracks: [makeTrackInput("math", "a", progress, [day])],
      reviews: [],
      exams,
      streak: null,
      now: NOW,
    });
    expect(vm.hasAnyData).toBe(true);
    expect(vm.accuracy.overall).toBe(100);
    expect(vm.daysSections.daysComplete).toBe(1);
    expect(vm.examResults).toHaveLength(1);
    expect(vm.lastActiveIso).toBe("2024-06-15T10:00:00.000Z");
  });

  it("reports hasAnyData=false when all tracks are empty", () => {
    const day = makeDay("day-1", [makeSection("day-1-section-1", [makeExercise(EX1)])]);
    const vm = deriveAllMetrics({
      tracks: [makeTrackInput("math", "a", makeProgress({}), [day])],
      reviews: [],
      exams: [],
      streak: null,
      now: NOW,
    });
    expect(vm.hasAnyData).toBe(false);
    expect(vm.accuracy.overall).toBeNull();
  });
});
