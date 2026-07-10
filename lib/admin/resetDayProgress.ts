import { getWorkbookDays } from "@/lib/content/workbook";
import { getAllEnglishDays, getEnglishDays } from "@/lib/content/english-workbook";
import { getAllScienceDays, getScienceDays } from "@/lib/content/science-workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { clearGmatChallengeState } from "@/lib/gmat-challenge/storage";
import { clearFinalExamState } from "@/lib/final-exam/storage";
import { clearEnglishFinalExamState } from "@/lib/english/final-exam/storage";
import { clearScienceFinalExamState } from "@/lib/science/final-exam/storage";
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
  /** When true, the cascade un-completed English level A → revoke english grade-B. */
  shouldRevokeGradeBUnlock: boolean;
};

/**
 * English admin "reset day" cascades from the chosen day through the end of the English
 * workbook (both levels share a single isolated store), mirroring the math cascade shape.
 * When the cascade resets a level-A lesson, level A can no longer be "complete", so we
 * clear the level-A final exam and signal the caller to revoke english grade-B.
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

  const levelADayIds = new Set(getEnglishDays("a").map((d) => d.id));
  const cascadeTouchedLevelA = ordered.slice(startIndex).some((d) => levelADayIds.has(d.id));
  if (cascadeTouchedLevelA) {
    clearEnglishFinalExamState("a");
  }

  return { nextState: next, shouldRevokeGradeBUnlock: cascadeTouchedLevelA };
}

export type ResetAdminScienceDayProgressResult = {
  nextState: WorkbookProgressState;
  /** When true, the cascade un-completed Science כיתה א׳ → revoke science grade-B. */
  shouldRevokeGradeBUnlock: boolean;
};

/**
 * Science admin "reset day" cascades from the chosen day through the end of the Science
 * workbook (both levels share a single isolated store), mirroring the English cascade.
 * When the cascade resets a כיתה-א׳ lesson, that level can no longer be "complete", so we
 * clear its final exam and signal the caller to revoke science grade-B.
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

  const levelADayIds = new Set(getScienceDays("a").map((d) => d.id));
  const cascadeTouchedLevelA = ordered.slice(startIndex).some((d) => levelADayIds.has(d.id));
  if (cascadeTouchedLevelA) {
    clearScienceFinalExamState("a");
  }

  return { nextState: next, shouldRevokeGradeBUnlock: cascadeTouchedLevelA };
}
