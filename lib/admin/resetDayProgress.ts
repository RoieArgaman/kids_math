import { getWorkbookDays } from "@/lib/content/workbook";
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
