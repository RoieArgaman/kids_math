import { describe, expect, it } from "vitest";
import { mergeBundles, clampFutureTimestamps, FUTURE_SKEW_TOLERANCE_MS } from "@/lib/user-data/merge";
import type {
  UserProgressBundle,
  GradeProgressData,
  EnglishProgressData,
  ScienceProgressData,
} from "@/lib/user-data/types";
import type { WorkbookProgressState, DayId, DayProgressState } from "@/lib/types";
import type { StreakState } from "@/lib/streak/types";
import type { BadgeState } from "@/lib/badges/types";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GmatChallengeStateV1 } from "@/lib/gmat-challenge/types";
import type { ReviewState } from "@/lib/review/types";

const OLD = "2020-01-01T00:00:00.000Z";
const NEW = "2024-01-01T00:00:00.000Z";

function makeDay(dayId: string, updatedAt: string, bestTimeMs?: number): DayProgressState {
  return {
    dayId: dayId as DayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    wrongBySection: {},
    attempts: [],
    percentDone: 100,
    isComplete: true,
    updatedAt,
    ...(bestTimeMs !== undefined ? { bestTimeMs } : {}),
  };
}

function makeWorkbook(
  updatedAt: string,
  days: Record<string, DayProgressState> = {},
): WorkbookProgressState {
  return { version: 1, days: days as Record<DayId, DayProgressState>, updatedAt };
}

function makeStreak(updatedAt: string, currentStreak = 1): StreakState {
  return {
    version: 1,
    lastActiveDate: "2024-01-01",
    currentStreak,
    longestStreak: currentStreak,
    earnedBadges: [],
    updatedAt,
  };
}

function makeBadges(updatedAt: string): BadgeState {
  return { version: 1, grade: "a", unlocked: [], seenIds: [], updatedAt } as BadgeState;
}

function makeFinalExam(updatedAt: string): FinalExamState {
  return {
    version: 1,
    grade: "a",
    createdAt: OLD,
    pickerVersion: 1,
    selectedExerciseIds: [],
    answers: {},
    correctMap: {},
    attempts: {},
    updatedAt,
  } as FinalExamState;
}

function makeGmat(updatedAt: string): GmatChallengeStateV1 {
  return { updatedAt } as unknown as GmatChallengeStateV1;
}

function makeReview(updatedAt: string): ReviewState {
  return { version: 1, items: {}, updatedAt } as unknown as ReviewState;
}

function makeGrade(overrides: Partial<GradeProgressData> = {}): GradeProgressData {
  return {
    workbook: null,
    badges: null,
    finalExam: null,
    gmat: null,
    review: null,
    ...overrides,
  };
}

function makeBundle(overrides: Partial<UserProgressBundle> = {}): UserProgressBundle {
  return {
    bundleVersion: 4,
    updatedAt: NEW,
    streak: null,
    grades: { a: makeGrade(), b: makeGrade() },
    ...overrides,
  };
}

describe("mergeBundles", () => {
  it("returns incoming unchanged when existing is null", () => {
    const incoming = makeBundle({ streak: makeStreak(NEW) });
    expect(mergeBundles(null, incoming)).toBe(incoming);
  });

  it("returns incoming unchanged when existing is undefined", () => {
    const incoming = makeBundle({ streak: makeStreak(NEW) });
    expect(mergeBundles(undefined, incoming)).toBe(incoming);
  });

  it("does not throw when the stored doc is malformed (missing grades)", () => {
    const incoming = makeBundle({ streak: makeStreak(OLD, 1) });
    // Simulate a legacy/corrupt Firestore doc lacking `grades`.
    const malformed = { streak: makeStreak(NEW, 7) } as unknown as UserProgressBundle;
    const merged = mergeBundles(malformed, incoming);
    expect(merged.streak?.currentStreak).toBe(7); // newer stored streak preserved
    expect(merged.grades.a).toEqual(incoming.grades.a); // grades fall back to incoming
    expect(merged.grades.b).toEqual(incoming.grades.b);
  });

  describe("whole-domain LWW", () => {
    it("keeps the newer streak (existing newer)", () => {
      const existing = makeBundle({ streak: makeStreak(NEW, 9) });
      const incoming = makeBundle({ streak: makeStreak(OLD, 1) });
      expect(mergeBundles(existing, incoming).streak?.currentStreak).toBe(9);
    });

    it("keeps the newer streak (incoming newer)", () => {
      const existing = makeBundle({ streak: makeStreak(OLD, 1) });
      const incoming = makeBundle({ streak: makeStreak(NEW, 9) });
      expect(mergeBundles(existing, incoming).streak?.currentStreak).toBe(9);
    });

    it("keeps the newer badges/finalExam/gmat/review per grade", () => {
      const existing = makeBundle({
        grades: {
          a: makeGrade({
            badges: makeBadges(NEW),
            finalExam: makeFinalExam(OLD),
            gmat: makeGmat(NEW),
            review: makeReview(OLD),
          }),
          b: makeGrade(),
        },
      });
      const incoming = makeBundle({
        grades: {
          a: makeGrade({
            badges: makeBadges(OLD),
            finalExam: makeFinalExam(NEW),
            gmat: makeGmat(OLD),
            review: makeReview(NEW),
          }),
          b: makeGrade(),
        },
      });
      const a = mergeBundles(existing, incoming).grades.a;
      expect(a.badges?.updatedAt).toBe(NEW);
      expect(a.finalExam?.updatedAt).toBe(NEW);
      expect(a.gmat?.updatedAt).toBe(NEW);
      expect(a.review?.updatedAt).toBe(NEW);
    });

    it("present updatedAt beats missing/null domain", () => {
      const existing = makeBundle({ streak: null });
      const incoming = makeBundle({ streak: makeStreak(OLD) });
      expect(mergeBundles(existing, incoming).streak?.updatedAt).toBe(OLD);

      const existing2 = makeBundle({ streak: makeStreak(OLD) });
      const incoming2 = makeBundle({ streak: null });
      expect(mergeBundles(existing2, incoming2).streak?.updatedAt).toBe(OLD);
    });

    it("prefers incoming on an exact updatedAt tie", () => {
      const existing = makeBundle({ streak: makeStreak(NEW, 1) });
      const incoming = makeBundle({ streak: makeStreak(NEW, 2) });
      expect(mergeBundles(existing, incoming).streak?.currentStreak).toBe(2);
    });
  });

  describe("different-subjects regression", () => {
    it("keeps fresh math from existing AND fresh english from incoming", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { d1: makeDay("d1", NEW) }) }), b: makeGrade() },
        english: { workbook: makeWorkbook(OLD, { e1: makeDay("e1", OLD) }), finalExam: null, review: makeReview(OLD) },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { d1: makeDay("d1", OLD) }) }), b: makeGrade() },
        english: { workbook: makeWorkbook(NEW, { e1: makeDay("e1", NEW) }), finalExam: null, review: makeReview(NEW) },
      });
      const merged = mergeBundles(existing, incoming);
      // Math day kept from existing (newer), english kept from incoming (newer).
      expect(merged.grades.a.workbook?.days.d1.updatedAt).toBe(NEW);
      expect(merged.english?.workbook?.days.e1.updatedAt).toBe(NEW);
      expect(merged.english?.review?.updatedAt).toBe(NEW);
    });
  });

  describe("same-subject per-day merge", () => {
    it("unions days: Day5 from existing and Day3 from incoming both survive", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day5: makeDay("day5", NEW) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day3: makeDay("day3", NEW) }) }), b: makeGrade() },
      });
      const days = mergeBundles(existing, incoming).grades.a.workbook?.days ?? {};
      expect(Object.keys(days).sort()).toEqual(["day3", "day5"]);
    });

    it("for a day present on both sides, keeps the newer version", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: makeDay("day1", OLD) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW) }) }), b: makeGrade() },
      });
      expect(mergeBundles(existing, incoming).grades.a.workbook?.days.day1.updatedAt).toBe(NEW);
    });

    it("merges bestTimeMs to the min when both days define it", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW, 5000) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: makeDay("day1", OLD, 3000) }) }), b: makeGrade() },
      });
      expect(mergeBundles(existing, incoming).grades.a.workbook?.days.day1.bestTimeMs).toBe(3000);
    });

    it("takes bestTimeMs from whichever side defines it", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: makeDay("day1", OLD, 4200) }) }), b: makeGrade() },
      });
      expect(mergeBundles(existing, incoming).grades.a.workbook?.days.day1.bestTimeMs).toBe(4200);
    });

    it("sets workbook top-level updatedAt to the max of both sides", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: makeDay("day1", OLD) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW) }) }), b: makeGrade() },
      });
      const wb = mergeBundles(existing, incoming).grades.a.workbook;
      expect(wb?.updatedAt).toBe(NEW);
      expect(wb?.version).toBe(1);
    });

    it("treats a day missing updatedAt as oldest", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW) }) }), b: makeGrade() },
      });
      const noTs = makeDay("day1", NEW);
      delete noTs.updatedAt;
      const incoming = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: noTs }) }), b: makeGrade() },
      });
      // existing has a real timestamp; incoming's day has none → existing kept.
      expect(mergeBundles(existing, incoming).grades.a.workbook?.days.day1.updatedAt).toBe(NEW);
    });
  });

  describe("missing-side preservation", () => {
    it("keeps a workbook present on only one side", () => {
      const existing = makeBundle({
        grades: { a: makeGrade({ workbook: makeWorkbook(NEW, { day1: makeDay("day1", NEW) }) }), b: makeGrade() },
      });
      const incoming = makeBundle({ grades: { a: makeGrade(), b: makeGrade() } });
      expect(mergeBundles(existing, incoming).grades.a.workbook?.days.day1).toBeDefined();
    });

    it("keeps english present on only the existing side", () => {
      const english: EnglishProgressData = { workbook: makeWorkbook(NEW), finalExam: null, review: null };
      const existing = makeBundle({ english });
      const incoming = makeBundle();
      expect(mergeBundles(existing, incoming).english).toBe(english);
    });

    it("keeps science present on only the incoming side", () => {
      const science: ScienceProgressData = { workbook: makeWorkbook(NEW), finalExam: null, review: null };
      const existing = makeBundle();
      const incoming = makeBundle({ science });
      expect(mergeBundles(existing, incoming).science).toBe(science);
    });
  });

  describe("bundleVersion", () => {
    it("resolves to the max of the two sides", () => {
      const existing = makeBundle({ bundleVersion: 2 });
      const incoming = makeBundle({ bundleVersion: 4 });
      expect(mergeBundles(existing, incoming).bundleVersion).toBe(4);

      const existing2 = makeBundle({ bundleVersion: 4 });
      const incoming2 = makeBundle({ bundleVersion: 1 });
      expect(mergeBundles(existing2, incoming2).bundleVersion).toBe(4);
    });
  });
});

describe("clampFutureTimestamps", () => {
  const NOW = new Date("2024-06-01T12:00:00.000Z");
  const nowIso = NOW.toISOString();
  const farFuture = new Date(NOW.getTime() + FUTURE_SKEW_TOLERANCE_MS + 60_000).toISOString();
  const nearFuture = new Date(NOW.getTime() + 60_000).toISOString();

  it("clamps envelope + domain + day timestamps that are too far ahead", () => {
    const bundle = makeBundle({
      updatedAt: farFuture,
      streak: makeStreak(farFuture),
      grades: {
        a: makeGrade({ workbook: makeWorkbook(farFuture, { day1: makeDay("day1", farFuture) }) }),
        b: makeGrade(),
      },
    });
    const clamped = clampFutureTimestamps(bundle, NOW);
    expect(clamped.updatedAt).toBe(nowIso);
    expect(clamped.streak?.updatedAt).toBe(nowIso);
    expect(clamped.grades.a.workbook?.updatedAt).toBe(nowIso);
    expect(clamped.grades.a.workbook?.days.day1.updatedAt).toBe(nowIso);
  });

  it("leaves timestamps within tolerance untouched", () => {
    const bundle = makeBundle({
      updatedAt: nearFuture,
      streak: makeStreak(nearFuture),
    });
    const clamped = clampFutureTimestamps(bundle, NOW);
    expect(clamped.updatedAt).toBe(nearFuture);
    expect(clamped.streak?.updatedAt).toBe(nearFuture);
  });

  it("leaves past and invalid timestamps untouched", () => {
    const badDay = makeDay("day1", "not-a-date");
    const bundle = makeBundle({
      updatedAt: OLD,
      grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: badDay }) }), b: makeGrade() },
    });
    const clamped = clampFutureTimestamps(bundle, NOW);
    expect(clamped.updatedAt).toBe(OLD);
    expect(clamped.grades.a.workbook?.days.day1.updatedAt).toBe("not-a-date");
  });

  it("never introduces an explicit `updatedAt: undefined` for a day missing it", () => {
    // Regression: a pre-#49 day (or any day serialized without `updatedAt`) must not
    // gain an explicit `undefined`, which the Firestore Admin SDK rejects -> 500.
    const dayNoTs = makeDay("day1", OLD);
    delete (dayNoTs as { updatedAt?: string }).updatedAt;
    const bundle = makeBundle({
      grades: { a: makeGrade({ workbook: makeWorkbook(OLD, { day1: dayNoTs }) }), b: makeGrade() },
    });
    const day = clampFutureTimestamps(bundle, NOW).grades.a.workbook?.days.day1;
    expect(day?.updatedAt).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(day, "updatedAt")).toBe(false);
  });
});
