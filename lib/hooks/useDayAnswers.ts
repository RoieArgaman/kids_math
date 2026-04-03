"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { GradeId } from "@/lib/grades";
import { loadProgressState } from "@/lib/progress/storage";
import type { Exercise, ExerciseId, SectionId, WorkbookDay } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

interface UseDayAnswersOptions {
  day: WorkbookDay | undefined;
  grade: GradeId;
  sectionId: SectionId;
  allExercisesCount: number;
  setAnswer: (input: {
    exerciseId: ExerciseId;
    sectionId: SectionId;
    answer: string;
    isCorrect: boolean;
    totalExercises: number;
  }) => void;
}

function withoutExerciseKeys<T extends Record<string, unknown>>(prev: T, exerciseIds: string[]): T {
  const next = { ...prev };
  for (const id of exerciseIds) {
    delete next[id];
  }
  return next;
}

export interface DayAnswersState {
  answers: Record<string, string>;
  correctMap: Record<string, boolean>;
  feedback: Record<string, string>;
  attempts: Record<string, number>;
  wrongAttempts: Record<string, number>;
  hintUsed: Record<string, boolean>;
  resetAnswerState: () => void;
  resetAnswerStateForExerciseIds: (exerciseIds: string[]) => void;
  onChangeValue: (exerciseId: string, value: string) => void;
  onRetryExercise: (exerciseId: string) => void;
  onRevealHint: (exerciseId: string) => void;
  submitExercise: (exercise: Exercise) => void;
}

export function useDayAnswers({
  day,
  grade,
  sectionId,
  allExercisesCount,
  setAnswer,
}: UseDayAnswersOptions): DayAnswersState {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [hintUsed, setHintUsed] = useState<Record<string, boolean>>({});

  // Stable refs to avoid stale closures in submitExercise
  const answersRef = useRef(answers);
  const attemptsRef = useRef(attempts);
  const wrongAttemptsRef = useRef(wrongAttempts);
  useEffect(() => {
    answersRef.current = answers;
    attemptsRef.current = attempts;
    wrongAttemptsRef.current = wrongAttempts;
  }, [answers, attempts, wrongAttempts]);

  // Restore state from localStorage on mount / day change
  useEffect(() => {
    if (!day) {
      return;
    }

    const saved = loadProgressState({ grade }).days[day.id];
    if (!saved) {
      return;
    }

    const restoredAnswers: Record<string, string> = {};
    for (const [exerciseId, value] of Object.entries(saved.answers)) {
      restoredAnswers[exerciseId] = String(value);
    }
    setAnswers(restoredAnswers);
    setCorrectMap(saved.correctAnswers ?? {});

    const attemptsByExercise = saved.attempts.reduce<Record<string, number>>((acc, attempt) => {
      const exerciseId =
        attempt &&
          typeof attempt === "object" &&
          "exerciseId" in attempt &&
          typeof (attempt as { exerciseId?: unknown }).exerciseId === "string"
          ? (attempt as { exerciseId: string }).exerciseId
          : null;
      if (!exerciseId) {
        return acc;
      }
      acc[exerciseId] = (acc[exerciseId] ?? 0) + 1;
      return acc;
    }, {});
    setAttempts(attemptsByExercise);
  }, [day, grade]);

  const resetAnswerState = useCallback(() => {
    setAnswers({});
    setCorrectMap({});
    setFeedback({});
    setAttempts({});
    setWrongAttempts({});
    setHintUsed({});
  }, []);

  const resetAnswerStateForExerciseIds = useCallback((exerciseIds: string[]) => {
    setAnswers((prev) => withoutExerciseKeys(prev, exerciseIds));
    setCorrectMap((prev) => withoutExerciseKeys(prev, exerciseIds));
    setFeedback((prev) => withoutExerciseKeys(prev, exerciseIds));
    setAttempts((prev) => withoutExerciseKeys(prev, exerciseIds));
    setWrongAttempts((prev) => withoutExerciseKeys(prev, exerciseIds));
    setHintUsed((prev) => withoutExerciseKeys(prev, exerciseIds));
  }, []);

  const onChangeValue = useCallback((exerciseId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [exerciseId]: value }));
  }, []);

  const onRetryExercise = useCallback((exerciseId: string) => {
    setAnswers((prev) => ({ ...prev, [exerciseId]: "" }));
    setCorrectMap((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setFeedback((prev) => ({ ...prev, [exerciseId]: "" }));
  }, []);

  const submitExercise = useCallback(
    (exercise: Exercise) => {
      const userAnswer = answersRef.current[exercise.id] ?? "";
      const normalizedAnswer = normalizeAnswerValue(userAnswer);
      const previousAttempts = attemptsRef.current[exercise.id] ?? 0;
      if (normalizedAnswer === null) {
        setCorrectMap((prev) => ({ ...prev, [exercise.id]: false }));
        setFeedback((prev) => ({
          ...prev,
          [exercise.id]: getRetryFeedbackText(exercise, userAnswer, previousAttempts),
        }));
        setWrongAttempts((prev) => ({
          ...prev,
          [exercise.id]: (wrongAttemptsRef.current[exercise.id] ?? 0) + 1,
        }));
        return;
      }

      const success = isAnswerCorrect(exercise, userAnswer);
      if (!success) {
        setWrongAttempts((prev) => ({
          ...prev,
          [exercise.id]: (wrongAttemptsRef.current[exercise.id] ?? 0) + 1,
        }));
      }
      setCorrectMap((prev) => ({ ...prev, [exercise.id]: success }));
      const nextAttempt = previousAttempts + 1;
      setAttempts((prev) => ({ ...prev, [exercise.id]: nextAttempt }));
      setFeedback((prev) => ({
        ...prev,
        [exercise.id]: getRetryFeedbackText(exercise, userAnswer, nextAttempt),
      }));
      setAnswer({
        exerciseId: exercise.id as ExerciseId,
        sectionId,
        answer: userAnswer,
        isCorrect: success,
        totalExercises: allExercisesCount,
      });
    },
    [allExercisesCount, sectionId, setAnswer],
  );

  const onRevealHint = useCallback((exerciseId: string) => {
    setHintUsed((prev) => ({ ...prev, [exerciseId]: true }));
  }, []);

  return {
    answers,
    correctMap,
    feedback,
    attempts,
    wrongAttempts,
    hintUsed,
    resetAnswerState,
    resetAnswerStateForExerciseIds,
    onChangeValue,
    onRetryExercise,
    onRevealHint,
    submitExercise,
  };
}
