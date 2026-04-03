import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  applyBestTimeMsIfImproved,
  COMPLETION_GATE_PERCENT,
  createInitialWorkbookProgressState,
  getOrCreateDayProgress,
  markDayComplete,
  resetDayProgress,
  resetSectionProgress,
  setAnswerForDay,
} from "@/lib/progress/engine";
import { loadProgressState, saveProgressState } from "@/lib/progress/storage";
import type { AnswerValue, DayId, ExerciseId, SectionId } from "@/lib/types";
import { logEvent } from "@/lib/analytics/events";
import type { GradeId } from "@/lib/grades";
import { DEFAULT_GRADE } from "@/lib/grades";

interface SetAnswerArgs {
  exerciseId: ExerciseId;
  sectionId: SectionId;
  answer: AnswerValue;
  isCorrect: boolean;
  totalExercises: number;
}

interface UseProgressApi {
  setAnswer: (args: SetAnswerArgs) => void;
  markComplete: () => boolean;
  resetDay: () => void;
  resetSection: (sectionId: SectionId, exerciseIds: ExerciseId[], totalExercises: number) => void;
  improveBestTime: (elapsedMs: number) => void;
  isComplete: boolean;
  percentDone: number;
  wrongCount: number;
  sectionWrongCount: number;
  correctAnswers: Record<ExerciseId, boolean>;
  completedAt: string | undefined;
  firstAttemptedAt: string | undefined;
  bestTimeMs: number | undefined;
}

export function useProgress(
  dayId: DayId,
  options: { grade?: GradeId; sectionId?: SectionId } = {},
): UseProgressApi {
  const grade = options.grade ?? DEFAULT_GRADE;
  const sectionId = options.sectionId;
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
    ({ exerciseId, sectionId: sid, answer, isCorrect, totalExercises }: SetAnswerArgs) => {
      setState((current) =>
        setAnswerForDay(current, {
          dayId,
          sectionId: sid,
          exerciseId,
          answer,
          isCorrect,
          totalExercises,
        }),
      );
      logEvent("answer_submitted", {
        dayId,
        sectionId: sid,
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

  const resetSection = useCallback(
    (sid: SectionId, exerciseIds: ExerciseId[], totalExercises: number) => {
      setState((current) => resetSectionProgress(current, dayId, sid, exerciseIds, totalExercises));
    },
    [dayId],
  );

  const improveBestTime = useCallback(
    (elapsedMs: number) => {
      setState((current) => applyBestTimeMsIfImproved(current, dayId, elapsedMs));
    },
    [dayId],
  );

  const wrongBySection = dayProgress.wrongBySection ?? {};
  const sectionWrongCount =
    sectionId !== undefined ? (wrongBySection[sectionId] ?? 0) : 0;

  return {
    setAnswer,
    markComplete,
    resetDay,
    resetSection,
    improveBestTime,
    isComplete: dayProgress.isComplete,
    percentDone: dayProgress.percentDone,
    wrongCount: dayProgress.wrongCount,
    sectionWrongCount,
    correctAnswers: dayProgress.correctAnswers,
    completedAt: dayProgress.completedAt,
    firstAttemptedAt: dayProgress.attempts[0]?.attemptedAt,
    bestTimeMs: dayProgress.bestTimeMs,
  };
}
