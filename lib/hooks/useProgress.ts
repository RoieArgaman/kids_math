import { useCallback, useEffect, useMemo, useState } from "react";

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

export function useProgress(dayId: DayId): UseProgressApi {
  const [state, setState] = useState(createInitialWorkbookProgressState);
  const [isHydrated, setIsHydrated] = useState(false);

  const dayProgress = useMemo(() => getOrCreateDayProgress(state, dayId), [state, dayId]);

  useEffect(() => {
    setState(loadProgressState());
    setIsHydrated(true);
    logEvent("state_loaded", { dayId });
  }, [dayId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    saveProgressState(state);
    logEvent("state_saved");
  }, [isHydrated, state]);

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
        payload: { isCorrect },
      });
    },
    [dayId],
  );

  const markComplete = useCallback((): boolean => {
    let didComplete = false;
    let alreadyComplete = false;
    let gatePassed = false;

    setState((current) => {
      const before = getOrCreateDayProgress(current, dayId);
      alreadyComplete = before.isComplete;
      gatePassed = before.percentDone >= COMPLETION_GATE_PERCENT;
      const next = markDayComplete(current, dayId);
      const after = getOrCreateDayProgress(next, dayId);
      didComplete = !before.isComplete && after.isComplete;
      return next;
    });

    if (alreadyComplete) {
      return true;
    }

    if (didComplete) {
      logEvent("completion_gate_passed", { dayId });
      logEvent("day_completed", { dayId });
      return true;
    }

    if (!gatePassed) {
      logEvent("completion_gate_blocked", { dayId });
    }
    return false;
  }, [dayId]);

  const resetDay = useCallback(() => {
    setState((current) => resetDayProgress(current, dayId));
    logEvent("state_saved", { dayId });
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
