import {
  type Exercise,
  type AnswerValue,
  type DayId,
  type DayProgressState,
  type ExerciseId,
  type ExerciseAttempt,
  type WorkbookDay,
  type WorkbookProgressState,
} from "@/lib/types";

export const COMPLETION_GATE_PERCENT = 100;
export const MAX_DAILY_WRONG_ANSWERS = 10;

export interface SetAnswerInput {
  dayId: DayId;
  exerciseId: ExerciseId;
  answer: AnswerValue;
  isCorrect: boolean;
  totalExercises: number;
  attemptedAt?: string;
}

export function createInitialWorkbookProgressState(): WorkbookProgressState {
  return {
    version: 1,
    days: {},
    updatedAt: new Date().toISOString(),
  };
}

export function createInitialDayProgressState(dayId: DayId): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    attempts: [],
    percentDone: 0,
    isComplete: false,
  };
}

export function getOrCreateDayProgress(
  state: WorkbookProgressState,
  dayId: DayId,
): DayProgressState {
  return state.days[dayId] ?? createInitialDayProgressState(dayId);
}

export function calculatePercentDone(
  answerCount: number,
  totalExercises: number,
): number {
  if (totalExercises <= 0) {
    return 0;
  }
  const pct = (answerCount / totalExercises) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function passesCompletionGate(
  percentDone: number,
  thresholdPercent = COMPLETION_GATE_PERCENT,
): boolean {
  return percentDone >= thresholdPercent;
}

/** Personal best = lower elapsed time. Used by `markDayComplete` and `applyBestTimeMsIfImproved`. */
export function mergeBestTimeMs(previousBestMs: number | undefined, candidateMs: number): number {
  return previousBestMs === undefined ? candidateMs : Math.min(previousBestMs, candidateMs);
}

export function computeElapsedMsForCompletedDay(dayState: DayProgressState): number | null {
  if (!dayState.completedAt || dayState.attempts.length === 0) {
    return null;
  }
  if (!passesCompletionGate(dayState.percentDone)) {
    return null;
  }
  const start = new Date(dayState.attempts[0].attemptedAt).getTime();
  const end = new Date(dayState.completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  return Math.max(0, end - start);
}

export function applyBestTimeMsIfImproved(
  state: WorkbookProgressState,
  dayId: DayId,
  elapsedMs: number,
): WorkbookProgressState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return state;
  }
  const dayState = getOrCreateDayProgress(state, dayId);
  const prev = dayState.bestTimeMs;
  const next = mergeBestTimeMs(prev, elapsedMs);
  if (next === prev) {
    return state;
  }
  return {
    ...state,
    days: {
      ...state.days,
      [dayId]: { ...dayState, bestTimeMs: next },
    },
    updatedAt: new Date().toISOString(),
  };
}

export function setAnswerForDay(
  state: WorkbookProgressState,
  input: SetAnswerInput,
): WorkbookProgressState {
  const dayState = getOrCreateDayProgress(state, input.dayId);
  const nextAnswers = {
    ...dayState.answers,
    [input.exerciseId]: input.answer,
  };

  const attempt: ExerciseAttempt = {
    exerciseId: input.exerciseId,
    answer: input.answer,
    isCorrect: input.isCorrect,
    attemptedAt: input.attemptedAt ?? new Date().toISOString(),
  };

  const nextCorrectAnswers = {
    ...dayState.correctAnswers,
    [input.exerciseId]: input.isCorrect,
  };
  const wrongIncrement = input.isCorrect || dayState.isComplete ? 0 : 1;
  const wrongCount = dayState.wrongCount + wrongIncrement;
  const correctCount = Object.values(nextCorrectAnswers).filter(Boolean).length;
  const percentDone = calculatePercentDone(correctCount, input.totalExercises);
  const canComplete = passesCompletionGate(percentDone);

  const nextDayState: DayProgressState = {
    ...dayState,
    answers: nextAnswers,
    correctAnswers: nextCorrectAnswers,
    wrongCount,
    attempts: [...dayState.attempts, attempt],
    percentDone,
    isComplete: dayState.isComplete || canComplete,
    completedAt: dayState.completedAt ?? (canComplete ? new Date().toISOString() : undefined),
  };

  return {
    ...state,
    days: {
      ...state.days,
      [input.dayId]: nextDayState,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function markDayComplete(
  state: WorkbookProgressState,
  dayId: DayId,
): WorkbookProgressState {
  const dayState = getOrCreateDayProgress(state, dayId);
  if (!passesCompletionGate(dayState.percentDone)) {
    return state;
  }

  const elapsed = computeElapsedMsForCompletedDay(dayState);
  let nextBestTimeMs = dayState.bestTimeMs;
  if (elapsed !== null) {
    nextBestTimeMs = mergeBestTimeMs(dayState.bestTimeMs, elapsed);
  }

  const nextDayState: DayProgressState = {
    ...dayState,
    isComplete: true,
    completedAt: dayState.completedAt ?? new Date().toISOString(),
    bestTimeMs: nextBestTimeMs,
  };

  return {
    ...state,
    days: {
      ...state.days,
      [dayId]: nextDayState,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function forceMarkDayComplete(
  state: WorkbookProgressState,
  dayId: DayId,
  options?: { day?: WorkbookDay; fillAnswers?: boolean },
): WorkbookProgressState {
  const dayState = getOrCreateDayProgress(state, dayId);
  const now = new Date().toISOString();
  const completedAt = dayState.completedAt ?? now;
  const shouldFillAnswers = Boolean(options?.fillAnswers && options?.day);

  let answers = dayState.answers;
  let correctAnswers = dayState.correctAnswers;
  let attempts = dayState.attempts;
  if (shouldFillAnswers && options?.day) {
    const exercises = options.day.sections.flatMap((section) => section.exercises);
    answers = Object.fromEntries(
      exercises.map((exercise) => [exercise.id, answerValueForExercise(exercise)]),
    ) as DayProgressState["answers"];
    correctAnswers = Object.fromEntries(exercises.map((exercise) => [exercise.id, true])) as DayProgressState["correctAnswers"];
    attempts = exercises.map((exercise) => ({
      exerciseId: exercise.id,
      answer: answerValueForExercise(exercise),
      isCorrect: true,
      attemptedAt: now,
    }));
  }

  const nextDayState: DayProgressState = {
    ...dayState,
    answers,
    correctAnswers,
    attempts,
    wrongCount: 0,
    percentDone: 100,
    isComplete: true,
    completedAt,
  };

  return {
    ...state,
    days: {
      ...state.days,
      [dayId]: nextDayState,
    },
    updatedAt: new Date().toISOString(),
  };
}

function answerValueForExercise(exercise: Exercise): AnswerValue {
  switch (exercise.kind) {
    case "number_input":
      return exercise.answer;
    case "number_line_jump":
      return exercise.answer;
    case "multiple_choice":
      return exercise.answer;
    case "true_false":
      return exercise.answer;
    case "shape_choice":
      return exercise.answer;
    default: {
      const exhaustiveCheck: never = exercise;
      return exhaustiveCheck;
    }
  }
}

export function resetDayProgress(
  state: WorkbookProgressState,
  dayId: DayId,
): WorkbookProgressState {
  return {
    ...state,
    days: {
      ...state.days,
      [dayId]: createInitialDayProgressState(dayId),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function canUnlockNextDay(
  currentDay: WorkbookDay,
  currentDayProgress: DayProgressState | undefined,
): boolean {
  if (!currentDayProgress) {
    return false;
  }
  return (
    currentDayProgress.isComplete &&
    passesCompletionGate(currentDayProgress.percentDone, currentDay.unlockThresholdPercent)
  );
}
