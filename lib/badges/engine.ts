import type { DayProgressState, WorkbookProgressState } from "@/lib/types/progress";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { WorkbookDay } from "@/lib/types/curriculum";
import type { GradeId } from "@/lib/grades";
import { getMinistryStrandsForGrade } from "@/lib/content/curriculum-plan";
import type { BadgeId } from "./types";

/**
 * Returns true only if every exercise in this completed day was answered
 * correctly on the FIRST attempt. Uses the attempts[] array rather than
 * wrongCount so that legacy stored data (where wrongCount defaulted to 0)
 * cannot falsely pass the check.
 */
function isFirstAttemptPerfect(d: DayProgressState): boolean {
  if (!d.isComplete || d.attempts.length === 0) return false;
  const seen = new Set<string>();
  for (const attempt of d.attempts) {
    if (!seen.has(attempt.exerciseId)) {
      seen.add(attempt.exerciseId);
      if (!attempt.isCorrect) return false;
    }
  }
  return true;
}

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

  // week complete badges: check weeks 1-4
  const weekGroups: Record<number, WorkbookDay[]> = {};
  for (const day of curriculum) {
    if (!weekGroups[day.week]) weekGroups[day.week] = [];
    weekGroups[day.week].push(day);
  }

  const weekComplete = (weekNum: number) => {
    const days = weekGroups[weekNum];
    return days && days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete === true);
  };

  if (weekComplete(1)) earned.push("week-1-complete");
  if (weekComplete(2)) earned.push("week-2-complete");
  if (weekComplete(3)) earned.push("week-3-complete");
  if (weekComplete(4)) earned.push("week-4-complete");

  // zero-mistakes / sharp-mind / flawless-five / zero-hero:
  // every exercise answered correctly on the FIRST attempt (attempts[] is authoritative)
  const perfectDays = Object.values(progress.days).filter(isFirstAttemptPerfect);
  if (perfectDays.length >= 1) earned.push("zero-mistakes");
  if (perfectDays.length >= 3) earned.push("sharp-mind");
  if (perfectDays.length >= 5) earned.push("flawless-five");
  if (perfectDays.length >= 10) earned.push("zero-hero");

  // speed-runner / speed-trio: bestTimeMs < 5 minutes (300,000 ms)
  const fastDays = Object.values(progress.days).filter(
    (d) => d.isComplete === true && d.bestTimeMs !== undefined && d.bestTimeMs < 300_000,
  );
  if (fastDays.length >= 1) earned.push("speed-runner");
  if (fastDays.length >= 3) earned.push("speed-trio");

  // lightning-fast: bestTimeMs < 3 minutes (180,000 ms)
  const lightningDays = Object.values(progress.days).filter(
    (d) => d.isComplete === true && d.bestTimeMs !== undefined && d.bestTimeMs < 180_000,
  );
  if (lightningDays.length >= 1) earned.push("lightning-fast");

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

  // perfect-week / perfect-two-weeks: every day in the week first-attempt perfect
  let perfectWeekCount = 0;
  for (const weekKey of Object.keys(weekGroups)) {
    const days = weekGroups[Number(weekKey)];
    if (
      days.length > 0 &&
      days.every((d: WorkbookDay) => {
        const dp = progress.days[d.id];
        return dp !== undefined && isFirstAttemptPerfect(dp);
      })
    ) {
      perfectWeekCount++;
    }
  }
  if (perfectWeekCount >= 1) earned.push("perfect-week");
  if (perfectWeekCount >= 2) earned.push("perfect-two-weeks");

  // comeback-kid / iron-will / ten-and-done
  const toughDays = Object.values(progress.days).filter(
    (d) => d.isComplete === true && d.wrongCount >= 5 && d.attempts.length >= 10,
  );
  if (toughDays.length >= 1) earned.push("comeback-kid");
  if (toughDays.length >= 3) earned.push("iron-will");

  if (Object.values(progress.days).some(
    (d) => d.isComplete === true && d.wrongCount >= 10 && d.attempts.length >= 15,
  )) {
    earned.push("ten-and-done");
  }

  // streak-3-days / streak-5-days / streak-10-days
  const completedCount = Object.values(progress.days).filter((d) => d.isComplete === true).length;
  if (completedCount >= 3) earned.push("streak-3-days");
  if (completedCount >= 5) earned.push("streak-5-days");
  if (completedCount >= 10) earned.push("streak-10-days");

  // halfway-there: completed >= half of content days (excluding exam day-29)
  // We exclude the exam day so the threshold matches actual learning content days,
  // consistent with grand-master and graduation badges.
  const contentDays = curriculum.filter((d) => d.id !== "day-29");
  if (contentDays.length > 0 && completedCount >= Math.ceil(contentDays.length / 2)) {
    earned.push("halfway-there");
  }

  // early-bird: any day where the first attempt started before 8:00 AM local time
  if (
    Object.values(progress.days).some((d) => {
      if (!d.isComplete || !d.attempts || d.attempts.length === 0) return false;
      const hour = new Date(d.attempts[0].attemptedAt).getHours();
      return hour < 8;
    })
  ) {
    earned.push("early-bird");
  }

  // weekend-warrior: any day completed on Friday (5) or Saturday (6) local time
  if (
    Object.values(progress.days).some((d) => {
      if (!d.isComplete || !d.completedAt) return false;
      const dow = new Date(d.completedAt).getDay();
      return dow === 5 || dow === 6;
    })
  ) {
    earned.push("weekend-warrior");
  }

  // NOTE: This calendar-streak logic is separate from lib/streak/engine.ts.
  // lib/streak tracks "app opened on consecutive days" (for StreakBadge on HomeScreen).
  // These badges track "at least one day completed on consecutive calendar dates".
  // They intentionally differ and must NOT be merged without a data migration plan.
  // calendar-streak-3 / calendar-streak-7: completed on consecutive calendar days
  const completedDateSet = new Set(
    Object.values(progress.days)
      .filter((d) => d.isComplete && d.completedAt)
      .map((d) => d.completedAt!.substring(0, 10)),
  );
  const sortedDates = Array.from(completedDateSet).sort();
  const ONE_DAY_MS = 86_400_000;
  let longestStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]).getTime();
    const curr = new Date(sortedDates[i]).getTime();
    if (curr - prev === ONE_DAY_MS) {
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 1;
    }
  }
  if (longestStreak >= 3) earned.push("calendar-streak-3");
  if (longestStreak >= 7) earned.push("calendar-streak-7");

  // ministry strand badges: all days in each strand must be complete
  const strands = getMinistryStrandsForGrade(grade);
  for (const strand of strands) {
    const strandDayIds = strand.dayNumbers.map((n) => `day-${n}` as const);
    const allStrandDaysComplete = strandDayIds.every(
      (id) => progress.days[id]?.isComplete === true,
    );
    if (allStrandDaysComplete) {
      if (strand.id === "natural-numbers") earned.push("strand-numbers");
      else if (strand.id === "operations") earned.push("strand-operations");
      else if (strand.id === "measurement-geometry") earned.push("strand-geometry");
      else if (strand.id === "supplementary-pedagogy") earned.push("strand-advanced");
    }
  }

  // exam performance badges (based on scorePercent from passed exam only)
  if (finalExam?.passed === true && finalExam.scorePercent !== undefined) {
    if (finalExam.scorePercent >= 90) earned.push("exam-high-score");
    if (finalExam.scorePercent >= 100) earned.push("exam-ace");
  }

  // grade-b-graduate: grade === "b" AND all curriculum days (except day-29) complete AND exam passed
  if (grade === "b") {
    const gradableDaysB = curriculum.filter((d) => d.id !== "day-29");
    if (
      gradableDaysB.length > 0 &&
      gradableDaysB.every((d) => progress.days[d.id]?.isComplete === true) &&
      finalExam?.passed === true
    ) {
      earned.push("grade-b-graduate");
    }
  }

  // grand-master: ALL curriculum days (except exam day) complete with every exercise
  // answered correctly on the FIRST attempt. Uses isFirstAttemptPerfect (same as
  // zero-hero / flawless-five) so legacy data with wrongCount=0 but empty attempts
  // cannot falsely trigger this platinum badge.
  const allGradableDays = curriculum.filter((d) => d.id !== "day-29");
  if (
    allGradableDays.length > 0 &&
    allGradableDays.every((d) => {
      const dp = progress.days[d.id];
      return dp !== undefined && isFirstAttemptPerfect(dp);
    })
  ) {
    earned.push("grand-master");
  }

  // hundred-answers / five-hundred-answers: total questions answered across COMPLETED days only
  const totalAnswers = Object.values(progress.days)
    .filter((d) => d.isComplete === true)
    .reduce((sum, d) => sum + Object.keys(d.answers).length, 0);
  if (totalAnswers >= 100) earned.push("hundred-answers");
  if (totalAnswers >= 500) earned.push("five-hundred-answers");

  return earned;
}
