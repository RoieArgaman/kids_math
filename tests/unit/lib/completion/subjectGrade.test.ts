import { afterEach, describe, expect, it, vi } from "vitest";

// Mock every store the completion layer reads. Each mock returns controllable
// days + progress + exam so we can assert the strict "all days AND exam" rule.
vi.mock("@/lib/content/workbook", () => ({
  getWorkbookDays: vi.fn(),
}));
vi.mock("@/lib/progress/storage", () => ({
  loadProgressState: vi.fn(),
}));
vi.mock("@/lib/final-exam/storage", () => ({
  loadFinalExamState: vi.fn(),
}));
vi.mock("@/lib/final-exam/config", () => ({
  FINAL_EXAM_DAY_ID: "day-29",
}));
vi.mock("@/lib/content/english-workbook", () => ({
  getEnglishDays: vi.fn(),
}));
vi.mock("@/lib/english/storage", () => ({
  loadEnglishProgressState: vi.fn(),
}));
vi.mock("@/lib/english/final-exam/storage", () => ({
  loadEnglishFinalExamState: vi.fn(),
}));
vi.mock("@/lib/content/science-workbook", () => ({
  getScienceDays: vi.fn(),
}));
vi.mock("@/lib/science/storage", () => ({
  loadScienceProgressState: vi.fn(),
}));
vi.mock("@/lib/science/final-exam/storage", () => ({
  loadScienceFinalExamState: vi.fn(),
}));

import { getWorkbookDays } from "@/lib/content/workbook";
import { loadProgressState } from "@/lib/progress/storage";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { getEnglishDays } from "@/lib/content/english-workbook";
import { loadEnglishProgressState } from "@/lib/english/storage";
import { loadEnglishFinalExamState } from "@/lib/english/final-exam/storage";
import {
  isGradeUnlocked,
  isSubjectGradeComplete,
  isSubjectUnlockedInGrade,
} from "@/lib/completion/subjectGrade";

type Days = { id: string }[];
function days(ids: string[]): Days {
  return ids.map((id) => ({ id }));
}
function progress(completeIds: string[]) {
  return { days: Object.fromEntries(completeIds.map((id) => [id, { isComplete: true }])) };
}

afterEach(() => vi.clearAllMocks());

describe("isSubjectGradeComplete (math)", () => {
  it("is false when regular days are incomplete even if exam passed", () => {
    vi.mocked(getWorkbookDays).mockReturnValue(days(["day-1", "day-2", "day-29"]) as never);
    vi.mocked(loadProgressState).mockReturnValue(progress(["day-1"]) as never); // day-2 missing
    vi.mocked(loadFinalExamState).mockReturnValue({ passed: true } as never);
    expect(isSubjectGradeComplete("math", "a")).toBe(false);
  });

  it("is false when all days complete but exam NOT passed (strict AND)", () => {
    vi.mocked(getWorkbookDays).mockReturnValue(days(["day-1", "day-2", "day-29"]) as never);
    vi.mocked(loadProgressState).mockReturnValue(progress(["day-1", "day-2"]) as never);
    vi.mocked(loadFinalExamState).mockReturnValue({ passed: false } as never);
    expect(isSubjectGradeComplete("math", "a")).toBe(false);
  });

  it("is true when all regular days complete AND exam passed (exam day excluded)", () => {
    // day-29 (final-exam day) is NOT required to be marked complete as a regular day.
    vi.mocked(getWorkbookDays).mockReturnValue(days(["day-1", "day-2", "day-29"]) as never);
    vi.mocked(loadProgressState).mockReturnValue(progress(["day-1", "day-2"]) as never);
    vi.mocked(loadFinalExamState).mockReturnValue({ passed: true } as never);
    expect(isSubjectGradeComplete("math", "a")).toBe(true);
  });
});

describe("isSubjectUnlockedInGrade", () => {
  it("is always true for grade A", () => {
    expect(isSubjectUnlockedInGrade("english", "a")).toBe(true);
  });

  it("gates grade B on grade A completion", () => {
    vi.mocked(getEnglishDays).mockReturnValue(days(["e1"]) as never);
    vi.mocked(loadEnglishProgressState).mockReturnValue(progress([]) as never);
    vi.mocked(loadEnglishFinalExamState).mockReturnValue({ passed: false } as never);
    expect(isSubjectUnlockedInGrade("english", "b")).toBe(false);

    vi.mocked(loadEnglishProgressState).mockReturnValue(progress(["e1"]) as never);
    vi.mocked(loadEnglishFinalExamState).mockReturnValue({ passed: true } as never);
    expect(isSubjectUnlockedInGrade("english", "b")).toBe(true);
  });

  it("previewAll bypasses the grade-B gate", () => {
    vi.mocked(getEnglishDays).mockReturnValue(days(["e1"]) as never);
    vi.mocked(loadEnglishProgressState).mockReturnValue(progress([]) as never);
    vi.mocked(loadEnglishFinalExamState).mockReturnValue(null as never);
    expect(isSubjectUnlockedInGrade("english", "b", { previewAll: true })).toBe(true);
  });
});

describe("isGradeUnlocked (OR across subjects)", () => {
  it("grade A is always unlocked", () => {
    expect(isGradeUnlocked("a")).toBe(true);
  });

  it("grade B unlocks when ANY subject completed grade A", () => {
    // math incomplete
    vi.mocked(getWorkbookDays).mockReturnValue(days(["m1", "day-29"]) as never);
    vi.mocked(loadProgressState).mockReturnValue(progress([]) as never);
    vi.mocked(loadFinalExamState).mockReturnValue({ passed: false } as never);
    // english complete
    vi.mocked(getEnglishDays).mockReturnValue(days(["e1"]) as never);
    vi.mocked(loadEnglishProgressState).mockReturnValue(progress(["e1"]) as never);
    vi.mocked(loadEnglishFinalExamState).mockReturnValue({ passed: true } as never);
    expect(isGradeUnlocked("b")).toBe(true);
  });
});
