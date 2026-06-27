import { getWorkbookDays } from "@/lib/content/workbook";
import { getAllEnglishDays } from "@/lib/content/english-workbook";
import { getAllScienceDays } from "@/lib/content/science-workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { clearGmatChallengeState } from "@/lib/gmat-challenge/storage";
import { clearFinalExamState } from "@/lib/final-exam/storage";
import type { GradeId } from "@/lib/grades";
import { resetDayProgress } from "@/lib/progress/engine";
import type { DayId, WorkbookProgressState } from "@/lib/types";

export type ResetAdminDayProgressResult = {
  nextState: WorkbookProgressState;
  /** Cascade included the final-exam workbook day (day-29). */
  cascadeTouchedFinalExam: boolean;
  /** When true, client should POST /api/lock-grade-b (grade A only). */
  shouldRevokeGradeBUnlock: boolean;
};

/**
 * Admin "reset day" cascades from the chosen day through the end of the workbook so later
 * days do not stay artificially "complete". Final exam + GMAT challenge keys are cleared
 * when the cascade touches the final exam day.
 */
export function resetAdminDayProgress(
  state: WorkbookProgressState,
  dayId: DayId,
  grade: GradeId,
): ResetAdminDayProgressResult | null {
  const ordered = getWorkbookDays(grade);
  const startIndex = ordered.findIndex((d) => d.id === dayId);
  if (startIndex === -1) {
    return null;
  }

  let next = state;
  for (let i = startIndex; i < ordered.length; i++) {
    next = resetDayProgress(next, ordered[i].id as DayId);
  }

  const cascadeTouchedFinalExam = ordered.slice(startIndex).some((d) => d.id === FINAL_EXAM_DAY_ID);
  if (cascadeTouchedFinalExam) {
    clearFinalExamState(grade);
    clearGmatChallengeState(grade);
  }

  const shouldRevokeGradeBUnlock = grade === "a" && cascadeTouchedFinalExam;

  return {
    nextState: next,
    cascadeTouchedFinalExam,
    shouldRevokeGradeBUnlock,
  };
}

export type ResetAdminEnglishDayProgressResult = {
  nextState: WorkbookProgressState;
};

/**
 * English admin "reset day" cascades from the chosen day through the end of the English
 * (Pre-A1) workbook, mirroring the math cascade shape. English has NO final exam, GMAT
 * challenge, or grade-B unlock chain, so this path deliberately has zero side effects —
 * it only resets day progress and returns the next state for the caller to persist via
 * the English store (`saveTrackProgress` / `saveEnglishProgressState`).
 */
export function resetAdminEnglishDayProgress(
  state: WorkbookProgressState,
  dayId: DayId,
): ResetAdminEnglishDayProgressResult | null {
  const ordered = getAllEnglishDays();
  const startIndex = ordered.findIndex((d) => d.id === dayId);
  if (startIndex === -1) {
    return null;
  }

  let next = state;
  for (let i = startIndex; i < ordered.length; i++) {
    next = resetDayProgress(next, ordered[i].id as DayId);
  }

  return { nextState: next };
}

export type ResetAdminScienceDayProgressResult = {
  nextState: WorkbookProgressState;
};

/**
 * Science admin "reset day" cascades from the chosen day through the end of the Science
 * workbook (both grade levels share a single isolated store), mirroring the English
 * cascade shape. Science has NO final exam, GMAT challenge, or grade-B unlock chain in
 * its workbook, so this path has zero side effects — it only resets day progress and
 * returns the next state for the caller to persist via the Science store.
 */
export function resetAdminScienceDayProgress(
  state: WorkbookProgressState,
  dayId: DayId,
): ResetAdminScienceDayProgressResult | null {
  const ordered = getAllScienceDays();
  const startIndex = ordered.findIndex((d) => d.id === dayId);
  if (startIndex === -1) {
    return null;
  }

  let next = state;
  for (let i = startIndex; i < ordered.length; i++) {
    next = resetDayProgress(next, ordered[i].id as DayId);
  }

  return { nextState: next };
}
