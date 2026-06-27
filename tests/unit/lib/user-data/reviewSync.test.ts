import { afterEach, describe, expect, it } from "vitest";
import {
  buildBundleFromLocalStorage,
  hydrateLocalStorageFromBundle,
} from "@/lib/user-data/api";
import {
  englishReviewStorageKey,
  reviewStorageKey,
} from "@/lib/review/storage";
import { REVIEW_STORAGE_SCHEMA_VERSION } from "@/lib/review/types";
import type { UserProgressBundle } from "@/lib/user-data/types";
import type { ReviewState } from "@/lib/review/types";

const REVIEW_A_KEY = reviewStorageKey("a");
const REVIEW_B_KEY = reviewStorageKey("b");
const ENGLISH_REVIEW_KEY = englishReviewStorageKey();

const reviewState: ReviewState = {
  version: REVIEW_STORAGE_SCHEMA_VERSION,
  items: {
    "day-1-section-1-exercise-1": {
      exerciseId: "day-1-section-1-exercise-1",
      box: 3,
      dueAt: "2026-02-01T00:00:00.000Z",
      lastReviewedAt: "2026-01-15T00:00:00.000Z",
      timesSeen: 4,
      timesCorrect: 3,
    },
  },
  updatedAt: "2026-01-15T00:00:00.000Z",
};

const emptyGrade = { workbook: null, badges: null, finalExam: null, gmat: null, review: null };

afterEach(() => {
  window.localStorage.clear();
});

describe("review cross-device sync (bundle v3)", () => {
  it("builds a current bundle including review for grades + english when present", () => {
    window.localStorage.setItem(REVIEW_A_KEY, JSON.stringify(reviewState));
    window.localStorage.setItem(REVIEW_B_KEY, JSON.stringify(reviewState));
    window.localStorage.setItem(ENGLISH_REVIEW_KEY, JSON.stringify(reviewState));

    const bundle = buildBundleFromLocalStorage();
    expect(bundle.bundleVersion).toBe(4);
    expect(bundle.grades.a.review?.items["day-1-section-1-exercise-1"]?.box).toBe(3);
    expect(bundle.grades.b.review?.items["day-1-section-1-exercise-1"]?.box).toBe(3);
    expect(bundle.english?.review?.items["day-1-section-1-exercise-1"]?.box).toBe(3);
  });

  it("round-trips review data through hydrate (v3)", () => {
    const bundle = {
      bundleVersion: 3,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: {
        a: { ...emptyGrade, review: reviewState },
        b: { ...emptyGrade, review: reviewState },
      },
      english: { workbook: null, finalExam: null, review: reviewState },
    } as unknown as UserProgressBundle;

    hydrateLocalStorageFromBundle(bundle);

    expect(JSON.parse(window.localStorage.getItem(REVIEW_A_KEY)!).items["day-1-section-1-exercise-1"].box).toBe(3);
    expect(JSON.parse(window.localStorage.getItem(REVIEW_B_KEY)!).items["day-1-section-1-exercise-1"].box).toBe(3);
    expect(JSON.parse(window.localStorage.getItem(ENGLISH_REVIEW_KEY)!).items["day-1-section-1-exercise-1"].box).toBe(3);
  });

  it("backward-compat: a v2 bundle without review hydrates without throwing and leaves review keys absent", () => {
    const v2 = {
      bundleVersion: 2,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: null, badges: null, finalExam: null, gmat: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null },
      },
      english: { workbook: null, finalExam: null },
    } as unknown as UserProgressBundle;

    expect(() => hydrateLocalStorageFromBundle(v2)).not.toThrow();
    expect(window.localStorage.getItem(REVIEW_A_KEY)).toBeNull();
    expect(window.localStorage.getItem(REVIEW_B_KEY)).toBeNull();
    expect(window.localStorage.getItem(ENGLISH_REVIEW_KEY)).toBeNull();
  });

  it("backward-compat: a v1 bundle still hydrates without throwing", () => {
    const v1 = {
      bundleVersion: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: null, badges: null, finalExam: null, gmat: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null },
      },
    } as unknown as UserProgressBundle;

    expect(() => hydrateLocalStorageFromBundle(v1)).not.toThrow();
    expect(window.localStorage.getItem(REVIEW_A_KEY)).toBeNull();
    expect(window.localStorage.getItem(ENGLISH_REVIEW_KEY)).toBeNull();
  });
});
