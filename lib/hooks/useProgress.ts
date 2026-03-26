import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  COMPLETION_GATE_PERCENT,
  createInitialWorkbookProgressState,
  getOrCreateDayProgress,
  markDayComplete,
  resetDayProgress,
  setAnswerForDay,
} from "@/lib/progress/engine";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import type { AnswerValue, DayId, ExerciseId } from "@/lib/types";
import { logEvent } from "@/lib/analytics/events";
import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";

interface SetAnswerArgs {
  exerciseId: ExerciseId;
  answer: AnswerValue;
  isCorrect: boolean;
  totalExercises: number;
}

interface UseProgressApi {
  setAnswer: (args: SetAnswerArgs) => void;
  markComplete: () => boolean;
  resetDay: () => void;
  isComplete: boolean;
  percentDone: number;
  wrongCount: number;
}

export function useProgress(dayId: DayId, options: { grade?: GradeId } = {}): UseProgressApi {
  const grade = options.grade ?? DEFAULT_GRADE;
  const [state, setState] = useState(createInitialWorkbookProgressState);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastStateSavedLogAtRef = useRef<number>(0);

  const dayProgress = useMemo(() => getOrCreateDayProgress(state, dayId), [state, dayId]);

  useEffect(() => {
    lastStateSavedLogAtRef.current = 0;
    setState(loadProgressState({ grade }));
    setIsHydrated(true);
    logEvent("state_loaded", { dayId, payload: { grade } });
  }, [dayId, grade]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveProgressState(state, { grade });
    const now = Date.now();
    if (now - lastStateSavedLogAtRef.current >= 5000) {
      lastStateSavedLogAtRef.current = now;
      logEvent("state_saved", { payload: { grade } });
    }
  }, [isHydrated, state, grade]);

  const setAnswer = useCallback(
    ({ exerciseId, answer, isCorrect, totalExercises }: SetAnswerArgs) => {
      setState((current) =>
        setAnswerForDay(current, {
          dayId,
          exerciseId,
          answer,
          isCorrect,
          totalExercises,
        }),
      );
      logEvent("answer_submitted", {
        dayId,
        exerciseId,
        payload: { isCorrect, grade },
      });
    },
    [dayId, grade],
  );

  const markComplete = useCallback((): boolean => {
    // Avoid mutating outer variables inside `setState(updater)` because React may
    // invoke updaters more than once (StrictMode / concurrent rendering).
    const alreadyComplete = dayProgress.isComplete;
    if (alreadyComplete) {
      return true;
    }

    const gatePassed = dayProgress.percentDone >= COMPLETION_GATE_PERCENT;
    if (!gatePassed) {
      logEvent("completion_gate_blocked", { dayId, payload: { grade } });
      return false;
    }

    setState((current) => markDayComplete(current, dayId));
    logEvent("completion_gate_passed", { dayId, payload: { grade } });
    logEvent("day_completed", { dayId, payload: { grade } });
    return true;
  }, [dayId, dayProgress.isComplete, dayProgress.percentDone, grade]);

  const resetDay = useCallback(() => {
    setState((current) => resetDayProgress(current, dayId));
  }, [dayId]);

  return {
    setAnswer,
    markComplete,
    resetDay,
    isComplete: dayProgress.isComplete,
    percentDone: dayProgress.percentDone,
    wrongCount: dayProgress.wrongCount,
  };
}
