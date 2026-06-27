import type {
  DayId,
  Exercise,
  ExerciseAttempt,
  ExerciseId,
  SectionId,
  WorkbookDay,
  WorkbookProgressState,
} from "@/lib/types";
import { isDue } from "./engine";
import type { ReviewCandidate, ReviewState } from "./types";

export interface SelectReviewItemsInput {
  /** Progress for ONE track (math grade or english), from loadTrackProgress. */
  progress: WorkbookProgressState;
  /** All days for the SAME track, from getTrackDaysById — resolves exercise + skillTags. */
  daysById: Record<DayId, WorkbookDay>;
  /** Persisted SR overlay (graduation / due dates). */
  reviewState: ReviewState;
  now: string;
  /** Never review items from the day the learner is currently in. */
  excludeDayId: DayId;
  /** Hard cap on returned items. */
  max: number;
}

interface ResolvedExercise {
  exercise: Exercise;
  sectionId: SectionId;
  dayId: DayId;
}

function buildExerciseIndex(
  daysById: Record<DayId, WorkbookDay>,
): Map<ExerciseId, ResolvedExercise> {
  const index = new Map<ExerciseId, ResolvedExercise>();
  for (const day of Object.values(daysById)) {
    for (const section of day.sections) {
      for (const exercise of section.exercises) {
        index.set(exercise.id, { exercise, sectionId: section.id, dayId: day.id });
      }
    }
  }
  return index;
}

/** Earliest attempt by ISO timestamp (attempts are append-order; this is robustness-safe). */
function firstAttempt(attempts: ExerciseAttempt[]): ExerciseAttempt | undefined {
  return attempts.reduce<ExerciseAttempt | undefined>(
    (earliest, a) => (!earliest || a.attemptedAt < earliest.attemptedAt ? a : earliest),
    undefined,
  );
}

/** A null reviewItem (never reviewed) is maximally overdue → sorts first. */
function effectiveDueMs(candidate: ReviewCandidate): number {
  return candidate.reviewItem ? Date.parse(candidate.reviewItem.dueAt) : Number.NEGATIVE_INFINITY;
}

/** Greedy variety: prefer one item per primary skill tag, then fill remaining slots. */
function spreadBySkill(ranked: ReviewCandidate[], max: number): ReviewCandidate[] {
  const out: ReviewCandidate[] = [];
  const usedSkills = new Set<string>();
  for (const candidate of ranked) {
    if (out.length >= max) break;
    const key = candidate.skillTags[0] ?? "untagged";
    if (usedSkills.has(key)) continue;
    usedSkills.add(key);
    out.push(candidate);
  }
  if (out.length < max) {
    for (const candidate of ranked) {
      if (out.length >= max) break;
      if (out.includes(candidate)) continue;
      out.push(candidate);
    }
  }
  return out;
}

/**
 * Selects spiral-review items for the warm-up block.
 *
 * Candidate rule: an exercise whose FIRST attempt was incorrect (eventually-corrected
 * stumble). `correctAnswers` is intentionally NOT consulted — retry-until-correct makes
 * it near-empty. Retirement is driven by the Leitner {@link ReviewState} overlay instead.
 */
export function selectReviewItems(input: SelectReviewItemsInput): ReviewCandidate[] {
  const { progress, daysById, reviewState, now, excludeDayId, max } = input;
  if (max <= 0) return [];

  const index = buildExerciseIndex(daysById);
  const candidates: ReviewCandidate[] = [];

  for (const day of Object.values(progress.days)) {
    const byExercise = new Map<ExerciseId, ExerciseAttempt[]>();
    for (const attempt of day.attempts) {
      const arr = byExercise.get(attempt.exerciseId) ?? [];
      arr.push(attempt);
      byExercise.set(attempt.exerciseId, arr);
    }

    for (const [exerciseId, attempts] of Array.from(byExercise.entries())) {
      const resolved = index.get(exerciseId);
      if (!resolved) continue; // content drift — exercise no longer exists
      if (resolved.dayId === excludeDayId) continue;

      const first = firstAttempt(attempts);
      if (!first || first.isCorrect) continue; // must be first-attempt-wrong

      const reviewItem = reviewState.items[exerciseId] ?? null;
      if (reviewItem && !isDue(reviewItem, now)) continue; // not due yet / graduated

      const wrong = attempts.filter((a) => !a.isCorrect);
      const lastWrongAt = wrong.reduce(
        (latest, a) => (a.attemptedAt > latest ? a.attemptedAt : latest),
        first.attemptedAt,
      );

      candidates.push({
        exercise: resolved.exercise,
        sourceDayId: resolved.dayId,
        sourceSectionId: resolved.sectionId,
        incorrectAttempts: wrong.length,
        lastWrongAt,
        skillTags: resolved.exercise.meta.skillTags,
        reviewItem,
      });
    }
  }

  candidates.sort((a, b) => {
    const aDue = effectiveDueMs(a);
    const bDue = effectiveDueMs(b);
    // Compare values (not their delta): two equal -Infinity dues are `===`, so they
    // correctly fall through to the tiebreaks instead of yielding NaN from (-∞)-(-∞).
    if (aDue !== bDue) return aDue - bDue; // overdue first
    if (a.incorrectAttempts !== b.incorrectAttempts) {
      return b.incorrectAttempts - a.incorrectAttempts; // more struggle first
    }
    return Date.parse(b.lastWrongAt) - Date.parse(a.lastWrongAt); // more recent first
  });

  return spreadBySkill(candidates, max);
}
