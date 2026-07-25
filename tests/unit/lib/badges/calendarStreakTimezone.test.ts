import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import type { DayProgressState } from "@/lib/types/progress";
import { evaluateBadges } from "@/lib/badges/engine";

/**
 * Finding F3 — `calendar-streak-*` must bucket completions by LOCAL calendar day,
 * matching the rest of the app (streak engine, early-bird, weekend-warrior). It used
 * to bucket by the UTC date (`completedAt.slice(0,10)`), so a child completing near
 * local midnight was mis-counted.
 *
 * We pin the process timezone to a fixed UTC+2 (no DST) so the test is deterministic on
 * any machine. The three completions below fall on THREE consecutive LOCAL days
 * (Mar 10/11/12) but collapse to only TWO UTC days (Mar 10/10/11) — so the fixed code
 * awards calendar-streak-3 while the old UTC bucketing would have stopped at a 2-streak.
 */
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "Etc/GMT-2"; // POSIX sign is inverted ⇒ this is UTC+2, no DST
});
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

function day(dayId: DayId, completedAt: string): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    wrongBySection: {},
    attempts: [],
    completedAt,
    percentDone: 100,
    isComplete: true,
  };
}

const curriculum: WorkbookDay[] = [
  { id: "day-1", dayNumber: 1, title: "t", week: 1, objective: "o", spiralReviewTags: [], unlockThresholdPercent: 100, sections: [] },
];

describe("calendar-streak buckets by LOCAL day (F3)", () => {
  it("precondition: the pinned timezone is UTC+2", () => {
    // Guards against an environment that ignores a runtime TZ change — if this fails,
    // the timezone-dependent assertion below is not actually exercising the fix.
    expect(new Date("2026-03-10T23:00:00.000Z").getDate()).toBe(11);
  });

  it("awards calendar-streak-3 for 3 consecutive LOCAL days that share only 2 UTC days", () => {
    const progress: WorkbookProgressState = {
      version: 1,
      updatedAt: "2026-03-12T00:00:00.000Z",
      days: {
        // local Mar 10 12:00  (UTC Mar 10 10:00)
        "day-1": day("day-1", "2026-03-10T10:00:00.000Z"),
        // local Mar 11 01:00  (UTC Mar 10 23:00)  ← same UTC day as day-1
        "day-2": day("day-2", "2026-03-10T23:00:00.000Z"),
        // local Mar 12 01:00  (UTC Mar 11 23:00)
        "day-3": day("day-3", "2026-03-11T23:00:00.000Z"),
      } as WorkbookProgressState["days"],
    };

    const earned = evaluateBadges({ progress, finalExam: null, curriculum, grade: "a" });

    // Local dates Mar 10/11/12 are 3 consecutive days → badge earned.
    expect(earned).toContain("calendar-streak-3");
  });

  it("does NOT award calendar-streak-3 when local days are only 2 apart", () => {
    const progress: WorkbookProgressState = {
      version: 1,
      updatedAt: "2026-03-12T00:00:00.000Z",
      days: {
        "day-1": day("day-1", "2026-03-10T10:00:00.000Z"), // local Mar 10
        "day-2": day("day-2", "2026-03-10T23:00:00.000Z"), // local Mar 11
      } as WorkbookProgressState["days"],
    };

    const earned = evaluateBadges({ progress, finalExam: null, curriculum, grade: "a" });
    expect(earned).not.toContain("calendar-streak-3");
  });
});
