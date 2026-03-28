"use client";

import { memo, useCallback } from "react";
import { ExerciseBox } from "@/components/ExerciseBox";
import { childTid } from "@/lib/testIds";
import type { Exercise, ExerciseId } from "@/lib/types";

interface ExerciseItemProps {
  screenRootTestId: string;
  exercise: Exercise;
  value: string;
  retryMessage?: string;
  isCorrect?: boolean;
  wasChecked: boolean;
  isReadOnly?: boolean;
  showCheckButton?: boolean;
  setFocusRef: (exerciseId: ExerciseId, node: HTMLElement | null) => void;
  onChangeValue: (exerciseId: ExerciseId, value: string) => void;
  onSubmitExercise: (exercise: Exercise) => void;
  onNextInput: (exerciseId: ExerciseId) => void;
  onRetryExercise: (exerciseId: ExerciseId) => void;
  wrongAttempts: number;
  hintUsed: boolean;
  onRevealHint: (exerciseId: ExerciseId) => void;
}

function ExerciseItemBase({
  screenRootTestId,
  exercise,
  value,
  retryMessage,
  isCorrect,
  wasChecked,
  isReadOnly = false,
  showCheckButton = true,
  setFocusRef,
  onChangeValue,
  onSubmitExercise,
  onNextInput,
  onRetryExercise,
  wrongAttempts,
  hintUsed,
  onRevealHint,
}: ExerciseItemProps) {
  const onChange = useCallback(
    (nextValue: string) => {
      if (isReadOnly) return;
      onChangeValue(exercise.id, nextValue);
    },
    [exercise.id, isReadOnly, onChangeValue],
  );

  const onSubmit = useCallback(() => {
    if (isReadOnly) return;
    onSubmitExercise(exercise);
  }, [exercise, isReadOnly, onSubmitExercise]);

  const onNext = useCallback(() => onNextInput(exercise.id), [exercise.id, onNextInput]);

  const onRetry = useCallback(() => {
    if (isReadOnly) return;
    onRetryExercise(exercise.id);
  }, [exercise.id, isReadOnly, onRetryExercise]);

  const onHint = useCallback(() => {
    if (isReadOnly) return;
    onRevealHint(exercise.id);
  }, [exercise.id, isReadOnly, onRevealHint]);

  return (
    <div
      data-testid={childTid(screenRootTestId, "exerciseWrap", exercise.id)}
      ref={(node) => {
        const focusNode = node?.querySelector('[data-exercise-focus="true"]');
        setFocusRef(exercise.id, (focusNode as HTMLElement | null) ?? null);
      }}
    >
      <ExerciseBox
        exercise={exercise}
        value={value}
        retryMessage={retryMessage}
        isCorrect={isCorrect}
        wasChecked={wasChecked}
        showCheckButton={showCheckButton}
        wrongAttempts={wrongAttempts}
        hintUsed={hintUsed}
        onRevealHint={onHint}
        onChange={onChange}
        onSubmit={onSubmit}
        onNextInput={onNext}
        onRetry={onRetry}
      />
    </div>
  );
}

export const ExerciseItem = memo(ExerciseItemBase);
