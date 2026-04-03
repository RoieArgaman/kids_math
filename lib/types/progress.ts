import type { DayId, ExerciseId } from "./curriculum";

export type AnswerValue = string | number | boolean;

export interface ExerciseAttempt {
  exerciseId: ExerciseId;
  answer: AnswerValue;
  isCorrect: boolean;
  attemptedAt: string;
}

export interface DayProgressState {
  dayId: DayId;
  answers: Record<ExerciseId, AnswerValue>;
  correctAnswers: Record<ExerciseId, boolean>;
  wrongCount: number;
  /** Wrong submissions per section (limit + reset are per section). Keys are section ids (`day-*-section-*`). */
  wrongBySection: Record<string, number>;
  attempts: ExerciseAttempt[];
  completedAt?: string;
  bestTimeMs?: number;  // personal best completion time in ms; undefined until first completion
  percentDone: number;
  isComplete: boolean;
}

export interface WorkbookProgressState {
  version: 1;
  days: Record<DayId, DayProgressState>;
  updatedAt: string;
}
