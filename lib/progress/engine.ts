import {
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
  const wrongCount = dayState.wrongCount + (input.isCorrect ? 0 : 1);
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
    // Completion is sticky once achieved for stable unlock behavior.
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

  const nextDayState: DayProgressState = {
    ...dayState,
    isComplete: true,
    completedAt: dayState.completedAt ?? new Date().toISOString(),
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
