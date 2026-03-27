import { clearGmatChallengeState } from "@/lib/gmat-challenge/storage";
import { clearFinalExamState } from "@/lib/final-exam/storage";
import { clearProgressState } from "@/lib/progress/storage";

/**
 * Clears all persisted client state for grade B (workbook, final exam, GMAT challenge).
 * Call only after `/api/lock-grade-b` succeeds so we do not delete data while the unlock cookie remains.
 */
export function wipeGradeBClientState(): void {
  clearProgressState({ grade: "b" });
  clearFinalExamState("b");
  clearGmatChallengeState("b");
}
