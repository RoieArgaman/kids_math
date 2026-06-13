import { afterEach, describe, expect, it } from "vitest";
import {
  buildBundleFromLocalStorage,
  hydrateLocalStorageFromBundle,
} from "@/lib/user-data/api";
import { englishProgressStorageKey } from "@/lib/english/storage";
import { englishFinalExamStorageKey } from "@/lib/english/final-exam/storage";
import { workbookProgressStorageKey } from "@/lib/progress/storage";
import type { UserProgressBundle } from "@/lib/user-data/types";

const ENGLISH_KEY = englishProgressStorageKey();
const ENGLISH_EXAM_KEY = englishFinalExamStorageKey();

const englishWorkbook = {
  version: 1,
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
    },
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const englishExam = {
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  pickerVersion: 1,
  selectedExerciseIds: ["day-1-section-1-exercise-1"],
  answers: {},
  correctMap: {},
  submittedAt: "2026-01-02T00:00:00.000Z",
  scorePercent: 90,
  passed: true,
};

afterEach(() => {
  window.localStorage.clear();
});

describe("english cross-device sync (bundle v2)", () => {
  it("includes English progress + exam in the built bundle (v2)", () => {
    window.localStorage.setItem(ENGLISH_KEY, JSON.stringify(englishWorkbook));
    window.localStorage.setItem(ENGLISH_EXAM_KEY, JSON.stringify(englishExam));

    const bundle = buildBundleFromLocalStorage();
    expect(bundle.bundleVersion).toBe(2);
    expect(bundle.english?.workbook?.days["day-1"]?.isComplete).toBe(true);
    expect(bundle.english?.finalExam?.passed).toBe(true);
  });

  it("round-trips English data through hydrate", () => {
    const bundle = {
      bundleVersion: 2,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: { a: { workbook: null, badges: null, finalExam: null, gmat: null }, b: { workbook: null, badges: null, finalExam: null, gmat: null } },
      english: { workbook: englishWorkbook, finalExam: englishExam },
    } as unknown as UserProgressBundle;

    hydrateLocalStorageFromBundle(bundle);

    expect(JSON.parse(window.localStorage.getItem(ENGLISH_KEY)!).days["day-1"].isComplete).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(ENGLISH_EXAM_KEY)!).passed).toBe(true);
  });

  it("backward-compat: a v1 bundle (no english) hydrates math without throwing", () => {
    const v1 = {
      bundleVersion: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: englishWorkbook, badges: null, finalExam: null, gmat: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null },
      },
    } as unknown as UserProgressBundle;

    expect(() => hydrateLocalStorageFromBundle(v1)).not.toThrow();
    expect(window.localStorage.getItem(workbookProgressStorageKey("a"))).not.toBeNull();
    // No english data present in a v1 bundle.
    expect(window.localStorage.getItem(ENGLISH_KEY)).toBeNull();
  });
});
