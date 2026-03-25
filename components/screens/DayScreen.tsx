"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayHeader } from "@/components/DayHeader";
import { ExerciseBox } from "@/components/ExerciseBox";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { StarReward } from "@/components/StarReward";
import { logEvent } from "@/lib/analytics/events";
import { LEARNING_ROUTINE_STEPS } from "@/lib/content/curriculum-plan";
import { workbookDays } from "@/lib/content/days";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { canUnlockNextDay, COMPLETION_GATE_PERCENT, MAX_DAILY_WRONG_ANSWERS } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import { useProgress } from "@/lib/hooks/useProgress";
import { routes } from "@/lib/routes";
import type { DayId, Exercise, ExerciseId, WorkbookDay } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export function DayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;

  const router = useRouter();
  const { setAnswer, markComplete, resetDay, percentDone, isComplete, wrongCount } = useProgress(dayId, {
    grade: effectiveGrade,
  });
  const day = useMemo<WorkbookDay | undefined>(() => workbookDays.find((item) => item.id === dayId), [dayId]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showReward, setShowReward] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [previewAll, setPreviewAll] = useState(false);
  const [isRouteReady, setIsRouteReady] = useState(false);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});
  const resetNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (day) {
      logEvent("day_viewed", { dayId: day.id, payload: { grade: effectiveGrade } });
    }
  }, [day, effectiveGrade]);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setIsRouteReady(true);
  }, []);

  useEffect(() => {
    if (!day) {
      return;
    }
    if (!isRouteReady) {
      return;
    }
    if (previewAll) {
      setIsLocked(false);
      return;
    }
    const dayIndex = workbookDays.findIndex((item) => item.id === day.id);
    if (dayIndex <= 0) {
      setIsLocked(false);
      return;
    }
    const previousDay = workbookDays[dayIndex - 1];
    const progress = loadProgressState({ grade: effectiveGrade });
    const previousProgress = progress.days[previousDay.id];
    setIsLocked(!canUnlockNextDay(previousDay, previousProgress));
  }, [day, isRouteReady, previewAll, effectiveGrade]);

  useEffect(() => {
    if (!day) {
      return;
    }

    const saved = loadProgressState({ grade: effectiveGrade }).days[day.id];
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
  }, [day, effectiveGrade]);

  useEffect(() => {
    if (wrongCount < MAX_DAILY_WRONG_ANSWERS) {
      return;
    }
    if (resetNotice) {
      return;
    }
    resetDay();
    setAnswers({});
    setCorrectMap({});
    setFeedback({});
    setAttempts({});
    setShowReward(false);
    setResetNotice("הִגַּעַתְּ לְ-10 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ.");

    if (resetNoticeTimeoutRef.current) {
      clearTimeout(resetNoticeTimeoutRef.current);
    }
    resetNoticeTimeoutRef.current = setTimeout(() => {
      setResetNotice("");
    }, 5000);
  }, [wrongCount, resetDay, resetNotice]);

  useEffect(() => {
    return () => {
      if (resetNoticeTimeoutRef.current) {
        clearTimeout(resetNoticeTimeoutRef.current);
      }
    };
  }, []);

  if (!day) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-5xl">🔍</p>
          <p className="mb-4 text-lg font-semibold text-gray-700">הַיּוֹם לֹא נִמְצָא.</p>
          <Link
            href={routes.gradeHome(effectiveGrade, { previewAll })}
            className="touch-button mt-2 inline-block rounded-2xl bg-violet-400 px-6 py-3 font-semibold text-white shadow-sm"
          >
            חֲזָרָה לַחוֹבֶרֶת
          </Link>
        </div>
      </main>
    );
  }

  if (!isRouteReady || isLocked === null) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-5xl">⏳</p>
          <p className="text-lg font-semibold text-gray-700">טוֹעֲנִים אֶת הַיּוֹם...</p>
        </div>
      </main>
    );
  }

  if (isLocked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-6xl">🔒</p>
          <p className="mb-2 text-xl font-semibold text-gray-800">הַיּוֹם נָעוּל</p>
          <p className="mb-6 text-sm text-gray-500">
            צָרִיךְ לְהַשְׁלִים אֶת הַיּוֹם הַקּוֹדֵם בְּ-100% כְּדֵי לִפְתֹּחַ אֶת הַיּוֹם הַזֶּה.
          </p>
          <Link
            href={routes.gradeHome(effectiveGrade, { previewAll })}
            className="touch-button inline-block rounded-2xl bg-violet-400 px-6 py-3 font-semibold text-white shadow-sm"
          >
            חֲזוֹר הַבַּיְתָה
          </Link>
        </div>
      </main>
    );
  }

  const allExercises = day.sections.flatMap((section) => section.exercises);
  const passThreshold = COMPLETION_GATE_PERCENT;
  const canComplete = percentDone >= passThreshold;

  const exerciseOrder = allExercises.map((exercise) => exercise.id);

  const focusNextInput = (currentId: string) => {
    const currentIndex = exerciseOrder.findIndex((id) => id === currentId);
    const nextId = exerciseOrder[currentIndex + 1];
    if (!nextId) {
      return;
    }
    refs.current[nextId]?.focus();
  };

  const submitExercise = (exercise: Exercise) => {
    const userAnswer = answers[exercise.id] ?? "";
    const normalizedAnswer = normalizeAnswerValue(userAnswer);
    const previousAttempts = attempts[exercise.id] ?? 0;
    if (normalizedAnswer === null) {
      setCorrectMap((prev) => ({ ...prev, [exercise.id]: false }));
      setFeedback((prev) => ({
        ...prev,
        [exercise.id]: getRetryFeedbackText(exercise, userAnswer, previousAttempts),
      }));
      return;
    }

    const success = isAnswerCorrect(exercise, userAnswer);
    setCorrectMap((prev) => ({ ...prev, [exercise.id]: success }));
    const nextAttempt = previousAttempts + 1;
    setAttempts((prev) => ({ ...prev, [exercise.id]: nextAttempt }));
    setFeedback((prev) => ({
      ...prev,
      [exercise.id]: getRetryFeedbackText(exercise, userAnswer, nextAttempt),
    }));
    setAnswer({
      exerciseId: exercise.id as ExerciseId,
      answer: userAnswer,
      isCorrect: success,
      totalExercises: allExercises.length,
    });
  };

  const completeDay = () => {
    const passed = markComplete();
    if (!passed) {
      return;
    }
    setShowReward(true);
  };

  return (
    <main>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={routes.gradeHome(effectiveGrade, { previewAll })}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          חֲזָרָה לַחוֹבֶרֶת
        </Link>
        <Link
          href={routes.gradePicker({ previewAll })}
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          חזרה לבחירת כיתה
        </Link>
      </div>

      {/* Sticky progress header */}
      <div className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <p className="mb-1 text-xs font-semibold text-gray-600">📊 הַהִתְקַדְּמוּת שֶׁלִּי:</p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${passThreshold}%`} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2 sm:flex-none">
            <Link
              href={routes.gradeHome(effectiveGrade, { previewAll })}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 sm:flex-none sm:px-4"
            >
              חֲזוֹר לָרָאשִׁי
            </Link>
            <Link
              href={routes.gradePlan(effectiveGrade, { previewAll })}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 shadow-sm transition-colors hover:bg-violet-100 sm:flex-none sm:px-4"
            >
              תּוֹכְנִית לִמּוּדִים
            </Link>
          </div>
          <div
            className="error-counter-badge w-full items-center gap-1 px-4 py-1.5 text-sm font-semibold sm:w-auto"
            aria-live="polite"
          >
            💥 {wrongCount}/{MAX_DAILY_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      {/* Day header */}
      <div className="mb-4 mt-2">
        <DayHeader day={day} />
      </div>

      <details className="surface mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm shadow-sm">
        <summary className="cursor-pointer select-none font-semibold text-violet-900">
          אֵיךְ נַעֲבוֹד הַיּוֹם? (אַרְבַּעָה שְׁלָבִים)
        </summary>
        <ol className="mt-3 list-decimal list-inside space-y-2 pr-1 leading-relaxed text-slate-700">
          {LEARNING_ROUTINE_STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </details>

      {/* Reset notice */}
      {resetNotice ? (
        <div className="mb-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          ⚠️ {resetNotice}
        </div>
      ) : null}

      {/* Sections */}
      {day.sections.map((section) => (
        <div key={section.id} className="mb-6">
          <SectionBlock
            title={section.title}
            learningGoal={section.learningGoal}
            type={section.type}
            example={section.example}
          >
            {section.exercises.map((exercise) => (
              <div
                key={exercise.id}
                ref={(node) => {
                  const inputNode = node?.querySelector("input");
                  refs.current[exercise.id] = inputNode ?? null;
                }}
              >
                <ExerciseBox
                  exercise={exercise}
                  value={answers[exercise.id] ?? ""}
                  retryMessage={feedback[exercise.id]}
                  isCorrect={correctMap[exercise.id]}
                  wasChecked={(attempts[exercise.id] ?? 0) > 0}
                  onChange={(value) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [exercise.id]: value,
                    }))
                  }
                  onSubmit={() => submitExercise(exercise)}
                  onNextInput={() => focusNextInput(exercise.id)}
                  onRetry={() => {
                    setAnswers((prev) => ({ ...prev, [exercise.id]: "" }));
                    setCorrectMap((prev) => {
                      const next = { ...prev };
                      delete next[exercise.id];
                      return next;
                    });
                    setFeedback((prev) => ({ ...prev, [exercise.id]: "" }));
                  }}
                />
              </div>
            ))}
          </SectionBlock>
        </div>
      ))}

      {/* Completion panel */}
      {isComplete && canComplete ? (
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-100 to-green-200 p-6 text-center shadow-md border border-emerald-200">
          <p className="mb-1 text-5xl">✅</p>
          <p className="mb-1 text-2xl font-semibold text-emerald-900">כָּל הַכָּבוֹד!</p>
          <p className="mb-4 text-sm font-semibold text-emerald-700">
            הַיּוֹם הוּשְׁלַם בְּהַצְלָחָה — עָשִׂיתָ עֲבוֹדָה מְצוּיֶנֶת!
          </p>
          <p className="mb-4 text-base font-semibold text-emerald-900">
            צִיּוֹן: <strong>{Math.round(percentDone)}%</strong>
          </p>
          <button
            type="button"
            className="touch-button btn-accent w-full rounded-2xl py-4 text-lg font-semibold shadow-md opacity-80"
            onClick={completeDay}
          >
            הַיּוֹם הוּשְׁלַם ✨
          </button>
        </div>
      ) : isComplete && !canComplete ? (
        <div className="surface mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-amber-800">
            ⚠️ הַיּוֹם סוּמַּן כְּהוּשְׁלַם אַךְ הַצִּיּוֹן נָמוּךְ מִ-{passThreshold}%.
          </p>
          <p className="mb-4 text-base font-semibold text-amber-900">
            צִיּוֹן נוֹכְחִי: <strong>{Math.round(percentDone)}%</strong>
          </p>
          <button
            type="button"
            className="touch-button btn-disabled w-full rounded-2xl py-4 text-lg font-semibold opacity-80"
            onClick={completeDay}
            disabled={!canComplete}
          >
            הַיּוֹם הוּשְׁלַם
          </button>
        </div>
      ) : (
        <div className="surface mb-6 rounded-2xl p-5 shadow-sm">
          <p className="text-base font-semibold">
            צִיּוֹן נוֹכְחִי: <strong>{Math.round(percentDone)}%</strong>
          </p>
          {!canComplete ? (
            <p className="mt-2 text-sm font-semibold text-rose-700">
              כְּדֵי לְהַשְׁלִים יוֹם צָרִיךְ 100%. כָּרֶגַע חֲסֵרִים עוֹד{" "}
              {Math.max(0, Math.ceil(passThreshold - percentDone))}%.
            </p>
          ) : null}
          <button
            type="button"
            className={`touch-button mt-4 w-full rounded-2xl py-4 text-lg font-semibold shadow-md ${
              canComplete ? "btn-accent" : "btn-disabled"
            }`}
            onClick={completeDay}
            disabled={!canComplete}
          >
            סִיּוּם יוֹם 🎉
          </button>
        </div>
      )}

      <StarReward
        visible={showReward}
        onConfirm={() => router.push(routes.gradeHome(effectiveGrade, { previewAll }))}
      />
    </main>
  );
}

