import { describe, expect, it } from "vitest";
import type { WorkbookProgressState } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import {
  applyBestTimeMsIfImproved,
  createInitialDayProgressState,
  createInitialWorkbookProgressState,
  forceMarkDayComplete,
  forceMarkSectionComplete,
  markDayComplete,
  resetDayProgress,
  resetSectionProgress,
  setAnswerForDay,
} from "@/lib/progress/engine";

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const day1 = getWorkbookDaysById("a")["day-1"]!;
const firstSection = day1.sections[0]!;
const firstExercise = firstSection.exercises[0]!;
const totalExercises = day1.sections.reduce((sum, s) => sum + s.exercises.length, 0);

function answerFirstExercise(state: WorkbookProgressState): WorkbookProgressState {
  return setAnswerForDay(state, {
    dayId: "day-1",
    sectionId: firstSection.id,
    exerciseId: firstExercise.id,
    answer: 1,
    isCorrect: true,
    totalExercises,
  });
}

describe("engine day-level updatedAt stamping", () => {
  it("createInitialDayProgressState stamps updatedAt", () => {
    expect(createInitialDayProgressState("day-1").updatedAt).toMatch(ISO_RE);
  });

  it("setAnswerForDay stamps the day updatedAt", () => {
    const state = answerFirstExercise(createInitialWorkbookProgressState());
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("markDayComplete stamps the day updatedAt", () => {
    const state = forceMarkDayComplete(createInitialWorkbookProgressState(), "day-1", {
      day: day1,
      fillAnswers: true,
    });
    const completed = markDayComplete(state, "day-1");
    expect(completed.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("forceMarkDayComplete stamps the day updatedAt", () => {
    const state = forceMarkDayComplete(createInitialWorkbookProgressState(), "day-1", {
      day: day1,
      fillAnswers: true,
    });
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("forceMarkSectionComplete stamps the day updatedAt", () => {
    const state = forceMarkSectionComplete(
      createInitialWorkbookProgressState(),
      "day-1",
      firstSection.id,
      { day: day1 },
    );
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("applyBestTimeMsIfImproved stamps the day updatedAt on the improved day", () => {
    const base = createInitialWorkbookProgressState();
    const seeded: WorkbookProgressState = {
      ...base,
      days: { "day-1": createInitialDayProgressState("day-1") },
    };
    const state = applyBestTimeMsIfImproved(seeded, "day-1", 1234);
    expect(state.days["day-1"]?.bestTimeMs).toBe(1234);
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("resetDayProgress stamps a fresh day updatedAt", () => {
    let state = answerFirstExercise(createInitialWorkbookProgressState());
    state = resetDayProgress(state, "day-1");
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });

  it("resetSectionProgress stamps the day updatedAt", () => {
    let state = answerFirstExercise(createInitialWorkbookProgressState());
    state = resetSectionProgress(state, "day-1", firstSection.id, [firstExercise.id], totalExercises);
    expect(state.days["day-1"]?.updatedAt).toMatch(ISO_RE);
  });
});
