import type { WorkbookProgressState } from "@/lib/types/progress";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { WorkbookDay } from "@/lib/types/curriculum";
import type { GradeId } from "@/lib/grades";
import type { BadgeId } from "./types";

export interface EvaluateBadgesInput {
  progress: WorkbookProgressState;
  finalExam: FinalExamState | null;
  curriculum: WorkbookDay[];
  grade: GradeId;
}

export function evaluateBadges(input: EvaluateBadgesInput): BadgeId[] {
  const { progress, finalExam, curriculum, grade } = input;
  const earned: BadgeId[] = [];

  // first-day-done
  if (progress.days["day-1"]?.isComplete === true) {
    earned.push("first-day-done");
  }

  // week-1-complete: all curriculum days with week === 1 have isComplete === true
  const week1Days = curriculum.filter((d) => d.week === 1);
  if (week1Days.length > 0 && week1Days.every((d) => progress.days[d.id]?.isComplete === true)) {
    earned.push("week-1-complete");
  }

  // zero-mistakes: any day where isComplete === true && wrongCount === 0
  if (Object.values(progress.days).some((d) => d.isComplete === true && d.wrongCount === 0)) {
    earned.push("zero-mistakes");
  }

  // speed-runner: any day where isComplete === true AND completedAt is set AND first attempt exists
  // AND elapsed < 300_000ms
  if (
    Object.values(progress.days).some((d) => {
      if (!d.isComplete) return false;
      if (!d.completedAt) return false;
      if (!d.attempts || d.attempts.length === 0) return false;
      const elapsed =
        new Date(d.completedAt).getTime() - new Date(d.attempts[0].attemptedAt).getTime();
      return elapsed < 300_000;
    })
  ) {
    earned.push("speed-runner");
  }

  // grade-a-graduate: grade === "a" AND all curriculum days with id !== "day-29" are complete
  // AND finalExam?.passed === true
  if (grade === "a") {
    const gradableDays = curriculum.filter((d) => d.id !== "day-29");
    if (
      gradableDays.length > 0 &&
      gradableDays.every((d) => progress.days[d.id]?.isComplete === true) &&
      finalExam?.passed === true
    ) {
      earned.push("grade-a-graduate");
    }
  }

  // perfect-week: any week-group where every curriculum day has isComplete === true && wrongCount === 0
  const weekGroups: Record<number, WorkbookDay[]> = {};
  for (const day of curriculum) {
    if (!weekGroups[day.week]) weekGroups[day.week] = [];
    weekGroups[day.week].push(day);
  }
  for (const weekKey of Object.keys(weekGroups)) {
    const days = weekGroups[Number(weekKey)];
    if (
      days.length > 0 &&
      days.every((d: WorkbookDay) => {
        const dp = progress.days[d.id];
        return dp?.isComplete === true && dp.wrongCount === 0;
      })
    ) {
      earned.push("perfect-week");
      break;
    }
  }

  // comeback-kid: any day where isComplete === true && wrongCount >= 5
  if (Object.values(progress.days).some((d) => d.isComplete === true && d.wrongCount >= 5)) {
    earned.push("comeback-kid");
  }

  // streak-3-days: count of days where isComplete === true >= 3
  const completedCount = Object.values(progress.days).filter((d) => d.isComplete === true).length;
  if (completedCount >= 3) {
    earned.push("streak-3-days");
  }

  return earned;
}
