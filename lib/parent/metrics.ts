import type { GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import type {
  DayProgressState,
  Exercise,
  ExerciseAttempt,
  ExerciseId,
  SkillTag,
  WorkbookDay,
  WorkbookProgressState,
} from "@/lib/types";
import type { ReviewState } from "@/lib/review/types";
import type { StreakState } from "@/lib/streak/types";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { getSkillLabel } from "./skillLabels";

/**
 * Pure derive layer for the read-only Parent Dashboard.
 *
 * Every function here is referentially transparent: it takes already-loaded
 * store data as parameters and returns view-models. There is NO IO — no
 * `localStorage`, no `load*`/`save*`, no `logEvent`, no `fetch`. The screen
 * loads the six tracks once and pipes them through `deriveAllMetrics`.
 *
 * Key correctness rule: accuracy and weak-skills derive from `attempts[]`
 * (the immutable first-try signal), never from `correctAnswers` — the latter
 * is "ever correct" and is inflated to ~100% by retry-until-correct.
 */

/** Gaps between consecutive attempts longer than this are treated as "walked away" and clamped. */
export const IDLE_CLAMP_MS = 5 * 60 * 1000;
/** A skill must be seen at least this many times (first attempts) before it can be ranked "shaky". */
export const WEAK_SKILL_MIN_SEEN = 3;
/** Time-on-task is summed over attempts within this trailing window. */
export const TIME_ON_TASK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Identifies one of the six tracks (Math/English/Science × level a/b). */
export type TrackKey = { subject: Subject; grade: GradeId };

/** One track's loaded progress + the content (days) it maps to. */
export type TrackInput = {
  key: TrackKey;
  progress: WorkbookProgressState;
  days: WorkbookDay[];
};

/** One track's loaded spaced-repetition (Leitner) review state. */
export type ReviewInput = {
  key: TrackKey;
  state: ReviewState;
};

/** One track's loaded final-exam summary (null fields when not taken). */
export type ExamInput = {
  key: TrackKey;
  passed: boolean | null;
  scorePercent: number | null;
  submittedAt: string | null;
};

export type AccuracyVM = {
  /** 0–100, or null when there are no attempts anywhere. */
  overall: number | null;
  /** 0–100 per subject, or null when that subject has no attempts. */
  bySubject: Partial<Record<Subject, number | null>>;
};

export type DaysSectionsVM = {
  daysComplete: number;
  totalDays: number;
  sectionsComplete: number;
  totalSections: number;
};

/** Per-grade days/sections rollup — powers the grade-first dashboard grouping. */
export type DaysSectionsByGradeVM = Record<GradeId, DaysSectionsVM>;

export type TimeOnTaskVM = {
  /** Approximate active practice time over the trailing week, in ms (idle-clamped). */
  approxWeeklyMs: number;
  /** Fastest recorded day completion across all tracks, in ms, or null. */
  bestTimeMs: number | null;
};

export type StreakVM = {
  current: number;
  longest: number;
};

export type WeakSkillEntry = {
  tag: SkillTag;
  subject: Subject;
  /** Hebrew display label. */
  label: string;
  /** 0–1. */
  wrongRate: number;
  seen: number;
  wrong: number;
};

export type ReviewBacklogVM = {
  due: number;
  practicing: number;
  mastered: number;
};

export type ExamResultEntry = {
  key: TrackKey;
  passed: boolean | null;
  scorePercent: number | null;
  submittedAt: string | null;
};

export type ParentDashboardViewModels = {
  /** True when any track has at least one recorded attempt. Drives the whole-screen empty state. */
  hasAnyData: boolean;
  accuracy: AccuracyVM;
  daysSections: DaysSectionsVM;
  /** Per-grade days/sections rollup for the grade-first dashboard grouping. */
  daysSectionsByGrade: DaysSectionsByGradeVM;
  timeOnTask: TimeOnTaskVM;
  streak: StreakVM;
  weakSkills: WeakSkillEntry[];
  reviewBacklog: ReviewBacklogVM;
  examResults: ExamResultEntry[];
  /** ISO timestamp of the most recent attempt across all tracks, or null. */
  lastActiveIso: string | null;
};

/** First attempt per exercise id within one day, in chronological (append) order. */
function firstAttemptsForDay(attempts: ExerciseAttempt[]): ExerciseAttempt[] {
  const seen = new Set<ExerciseId>();
  const out: ExerciseAttempt[] = [];
  for (const attempt of attempts) {
    if (seen.has(attempt.exerciseId)) continue;
    seen.add(attempt.exerciseId);
    out.push(attempt);
  }
  return out;
}

/**
 * All first attempts for a track, scoped to the track's own content days.
 *
 * English and Science persist BOTH levels in a single progress store, so a
 * track is identified by its day-set (level a vs b), not by a separate store.
 * Reading `progress.days[day.id]` for only this track's days keeps the two
 * levels disjoint and prevents double-counting shared-store subjects.
 */
function firstAttemptsForTrack(track: TrackInput): ExerciseAttempt[] {
  const out: ExerciseAttempt[] = [];
  for (const day of track.days) {
    const dayProgress = track.progress.days[day.id];
    if (dayProgress) out.push(...firstAttemptsForDay(dayProgress.attempts));
  }
  return out;
}

function ratioToPercent(correct: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((correct / total) * 100);
}

/**
 * First-attempt accuracy, overall (weighted by attempt count) and per subject.
 * Uses the FIRST attempt per exercise id — never `correctAnswers`.
 */
export function deriveFirstAttemptAccuracy(tracks: TrackInput[]): AccuracyVM {
  let overallCorrect = 0;
  let overallTotal = 0;
  const perSubject = new Map<Subject, { correct: number; total: number }>();

  for (const track of tracks) {
    const subject = track.key.subject;
    const bucket = perSubject.get(subject) ?? { correct: 0, total: 0 };
    for (const attempt of firstAttemptsForTrack(track)) {
      bucket.total += 1;
      overallTotal += 1;
      if (attempt.isCorrect) {
        bucket.correct += 1;
        overallCorrect += 1;
      }
    }
    perSubject.set(subject, bucket);
  }

  const bySubject: Partial<Record<Subject, number | null>> = {};
  perSubject.forEach(({ correct, total }, subject) => {
    bySubject[subject] = ratioToPercent(correct, total);
  });

  return { overall: ratioToPercent(overallCorrect, overallTotal), bySubject };
}

/** A section is complete when every one of its exercises is in `correctAnswers === true`. */
function isSectionComplete(
  day: WorkbookDay,
  sectionIndex: number,
  dayProgress: DayProgressState | undefined,
): boolean {
  const section = day.sections[sectionIndex];
  if (!section || section.exercises.length === 0) return false;
  if (!dayProgress) return false;
  return section.exercises.every((ex) => dayProgress.correctAnswers[ex.id] === true);
}

/** Days & sections completed across all tracks. The final-exam pseudo-day is excluded. */
export function deriveDaysAndSections(tracks: TrackInput[]): DaysSectionsVM {
  return daysAndSectionsForTracks(tracks);
}

/** Days & sections completed for a single track (final-exam pseudo-day excluded). */
function daysAndSectionsForTracks(tracks: TrackInput[]): DaysSectionsVM {
  let daysComplete = 0;
  let totalDays = 0;
  let sectionsComplete = 0;
  let totalSections = 0;

  for (const track of tracks) {
    for (const day of track.days) {
      if (day.id === FINAL_EXAM_DAY_ID) continue;
      totalDays += 1;
      const dayProgress = track.progress.days[day.id];
      if (dayProgress?.isComplete) daysComplete += 1;
      day.sections.forEach((_section, idx) => {
        totalSections += 1;
        if (isSectionComplete(day, idx, dayProgress)) sectionsComplete += 1;
      });
    }
  }

  return { daysComplete, totalDays, sectionsComplete, totalSections };
}

/**
 * Per-grade days/sections rollup — the same counting as {@link deriveDaysAndSections}
 * but split by the grade axis (Grade A vs Grade B), so the dashboard can show
 * "כיתה א׳: X/Y ימים" then "כיתה ב׳: X/Y". Subjects that share a store (English/
 * Science) are already disjoint per track via each track's own day-set.
 */
export function deriveDaysAndSectionsByGrade(tracks: TrackInput[]): DaysSectionsByGradeVM {
  return {
    a: daysAndSectionsForTracks(tracks.filter((t) => t.key.grade === "a")),
    b: daysAndSectionsForTracks(tracks.filter((t) => t.key.grade === "b")),
  };
}

/**
 * Approximate active practice time over the trailing week.
 * Sums gaps between consecutive attempts within each day, clamping any gap
 * above {@link IDLE_CLAMP_MS}. Days with < 2 windowed attempts contribute 0.
 */
export function deriveTimeOnTask(
  tracks: TrackInput[],
  now: number = Date.now(),
  windowMs: number = TIME_ON_TASK_WINDOW_MS,
): TimeOnTaskVM {
  const windowStart = now - windowMs;
  let approxWeeklyMs = 0;
  let bestTimeMs: number | null = null;

  for (const track of tracks) {
    for (const contentDay of track.days) {
      const day = track.progress.days[contentDay.id];
      if (!day) continue;
      if (typeof day.bestTimeMs === "number" && Number.isFinite(day.bestTimeMs)) {
        bestTimeMs = bestTimeMs === null ? day.bestTimeMs : Math.min(bestTimeMs, day.bestTimeMs);
      }

      const windowed = day.attempts
        .map((a) => new Date(a.attemptedAt).getTime())
        .filter((t) => Number.isFinite(t) && t >= windowStart && t <= now)
        .sort((a, b) => a - b);

      for (let i = 1; i < windowed.length; i += 1) {
        const gap = windowed[i] - windowed[i - 1];
        if (gap <= 0) continue;
        approxWeeklyMs += Math.min(gap, IDLE_CLAMP_MS);
      }
    }
  }

  return { approxWeeklyMs, bestTimeMs };
}

export function deriveStreak(streak: StreakState | null): StreakVM {
  if (!streak) return { current: 0, longest: 0 };
  return { current: streak.currentStreak, longest: streak.longestStreak };
}

/** Build an exercise-id → Exercise lookup for one track's content. */
function exerciseIndex(days: WorkbookDay[]): Map<ExerciseId, Exercise> {
  const index = new Map<ExerciseId, Exercise>();
  for (const day of days) {
    for (const section of day.sections) {
      for (const exercise of section.exercises) {
        index.set(exercise.id, exercise);
      }
    }
  }
  return index;
}

/**
 * Weak-skill ranking. For each first attempt, credit every `meta.skillTags`
 * entry on that exercise with a "seen", and a "wrong" when the first attempt
 * was incorrect. Tags below {@link WEAK_SKILL_MIN_SEEN} are not ranked.
 * Grouped per (subject, tag) since the tag taxonomy is subject-scoped.
 */
export function deriveWeakSkills(
  tracks: TrackInput[],
  minSeen: number = WEAK_SKILL_MIN_SEEN,
): WeakSkillEntry[] {
  // key = `${subject}::${tag}`
  const tally = new Map<string, { subject: Subject; tag: SkillTag; seen: number; wrong: number }>();

  for (const track of tracks) {
    const subject = track.key.subject;
    const index = exerciseIndex(track.days);
    for (const attempt of firstAttemptsForTrack(track)) {
      const exercise = index.get(attempt.exerciseId);
      if (!exercise) continue;
      for (const tag of exercise.meta.skillTags) {
        const key = `${subject}::${tag}`;
        const bucket = tally.get(key) ?? { subject, tag, seen: 0, wrong: 0 };
        bucket.seen += 1;
        if (!attempt.isCorrect) bucket.wrong += 1;
        tally.set(key, bucket);
      }
    }
  }

  return Array.from(tally.values())
    .filter((b) => b.seen >= minSeen && b.wrong > 0)
    .map((b) => ({
      tag: b.tag,
      subject: b.subject,
      label: getSkillLabel(b.tag),
      wrongRate: b.wrong / b.seen,
      seen: b.seen,
      wrong: b.wrong,
    }))
    .sort((a, b) => b.wrongRate - a.wrongRate || b.seen - a.seen);
}

/** Leitner backlog buckets across all tracks. due/practicing are boxes 1–4; mastered is box 5. */
export function deriveReviewBacklog(
  reviews: ReviewInput[],
  now: number = Date.now(),
): ReviewBacklogVM {
  let due = 0;
  let practicing = 0;
  let mastered = 0;

  for (const review of reviews) {
    for (const item of Object.values(review.state.items)) {
      if (item.box === 5) {
        mastered += 1;
        continue;
      }
      const dueMs = new Date(item.dueAt).getTime();
      if (Number.isFinite(dueMs) && dueMs <= now) {
        due += 1;
      } else {
        practicing += 1;
      }
    }
  }

  return { due, practicing, mastered };
}

const SUBJECT_ORDER: Record<Subject, number> = { math: 0, english: 1, science: 2 };

/** Exam results ordered grade-first (Grade A before B), then by subject, for the grade-first IA. */
export function deriveExamResults(exams: ExamInput[]): ExamResultEntry[] {
  return exams
    .map((exam) => ({
      key: exam.key,
      passed: exam.passed,
      scorePercent: exam.scorePercent,
      submittedAt: exam.submittedAt,
    }))
    .sort((a, b) => {
      if (a.key.grade !== b.key.grade) return a.key.grade < b.key.grade ? -1 : 1;
      return SUBJECT_ORDER[a.key.subject] - SUBJECT_ORDER[b.key.subject];
    });
}

/** Most recent attempt timestamp across all tracks, or null. */
export function deriveLastActiveIso(tracks: TrackInput[]): string | null {
  let bestMs = -Infinity;
  let bestIso: string | null = null;
  for (const track of tracks) {
    for (const contentDay of track.days) {
      const day = track.progress.days[contentDay.id];
      if (!day) continue;
      for (const attempt of day.attempts) {
        const ms = new Date(attempt.attemptedAt).getTime();
        if (Number.isFinite(ms) && ms > bestMs) {
          bestMs = ms;
          bestIso = attempt.attemptedAt;
        }
      }
    }
  }
  return bestIso;
}

function tracksHaveAnyAttempt(tracks: TrackInput[]): boolean {
  return tracks.some((track) =>
    Object.values(track.progress.days).some((day) => day.attempts.length > 0),
  );
}

/** Compose all view-models. Call once per load; memoize on the inputs. */
export function deriveAllMetrics(params: {
  tracks: TrackInput[];
  reviews: ReviewInput[];
  exams: ExamInput[];
  streak: StreakState | null;
  now?: number;
}): ParentDashboardViewModels {
  const { tracks, reviews, exams, streak } = params;
  const now = params.now ?? Date.now();

  return {
    hasAnyData: tracksHaveAnyAttempt(tracks),
    accuracy: deriveFirstAttemptAccuracy(tracks),
    daysSections: deriveDaysAndSections(tracks),
    daysSectionsByGrade: deriveDaysAndSectionsByGrade(tracks),
    timeOnTask: deriveTimeOnTask(tracks, now),
    streak: deriveStreak(streak),
    weakSkills: deriveWeakSkills(tracks),
    reviewBacklog: deriveReviewBacklog(reviews, now),
    examResults: deriveExamResults(exams),
    lastActiveIso: deriveLastActiveIso(tracks),
  };
}
