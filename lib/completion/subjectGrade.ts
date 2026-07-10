import type { GradeId } from "@/lib/grades";
import { SUBJECTS, type Subject } from "@/lib/subjects";

import { getWorkbookDays } from "@/lib/content/workbook";
import { loadProgressState } from "@/lib/progress/storage";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";

import { getEnglishDays } from "@/lib/content/english-workbook";
import { loadEnglishProgressState } from "@/lib/english/storage";
import { loadEnglishFinalExamState } from "@/lib/english/final-exam/storage";

import { getScienceDays } from "@/lib/content/science-workbook";
import { loadScienceProgressState } from "@/lib/science/storage";
import { loadScienceFinalExamState } from "@/lib/science/final-exam/storage";

import type { WorkbookDay, WorkbookProgressState } from "@/lib/types";

/**
 * Single source of truth for "has the learner completed <subject> in <grade>".
 *
 * Completion (locked decision, strictest): ALL regular days complete AND that
 * subject+grade final exam passed. "Regular days" excludes a subject's final-exam
 * workbook day (math's `day-29`); English/Science exams live in separate storage
 * and are not workbook days, so their day lists are already exam-free.
 *
 * CLIENT-ONLY: reads localStorage via the per-subject stores. Never import this
 * from the edge middleware — the middleware trusts the unlock cookie instead.
 */

function everyDayComplete(days: WorkbookDay[], progress: WorkbookProgressState): boolean {
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete === true);
}

function isMathGradeComplete(grade: GradeId): boolean {
  const regularDays = getWorkbookDays(grade).filter((d) => d.id !== FINAL_EXAM_DAY_ID);
  const daysDone = everyDayComplete(regularDays, loadProgressState({ grade }));
  const examPassed = loadFinalExamState(grade)?.passed === true;
  return daysDone && examPassed;
}

function isEnglishGradeComplete(level: GradeId): boolean {
  const daysDone = everyDayComplete(getEnglishDays(level), loadEnglishProgressState());
  const examPassed = loadEnglishFinalExamState(level)?.passed === true;
  return daysDone && examPassed;
}

function isScienceGradeComplete(level: GradeId): boolean {
  const daysDone = everyDayComplete(getScienceDays(level), loadScienceProgressState());
  const examPassed = loadScienceFinalExamState(level)?.passed === true;
  return daysDone && examPassed;
}

export function isSubjectGradeComplete(subject: Subject, grade: GradeId): boolean {
  switch (subject) {
    case "math":
      return isMathGradeComplete(grade);
    case "english":
      return isEnglishGradeComplete(grade);
    case "science":
      return isScienceGradeComplete(grade);
  }
}

/**
 * Whether a specific subject is unlocked in a grade. Grade A is always open;
 * grade B for a subject requires that subject was completed in grade A.
 * `previewAll` (QA bypass) opens everything, consistent with existing gates.
 */
export function isSubjectUnlockedInGrade(
  subject: Subject,
  grade: GradeId,
  opts?: { previewAll?: boolean },
): boolean {
  if (grade === "a") return true;
  if (opts?.previewAll) return true;
  return isSubjectGradeComplete(subject, "a");
}

/**
 * Whether a whole grade is enterable (its subject picker + at least one subject).
 * Grade A is always open; grade B opens once ANY subject is completed in grade A.
 */
export function isGradeUnlocked(grade: GradeId, opts?: { previewAll?: boolean }): boolean {
  if (grade === "a") return true;
  if (opts?.previewAll) return true;
  return SUBJECTS.some((subject) => isSubjectGradeComplete(subject, "a"));
}
