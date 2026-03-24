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
import { workbookDays } from "@/lib/content/days";
import {
  canUnlockNextDay,
  COMPLETION_GATE_PERCENT,
  MAX_DAILY_WRONG_ANSWERS,
} from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import { useProgress } from "@/lib/hooks/useProgress";
import type { DayId, Exercise, ExerciseId, WorkbookDay } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect } from "@/lib/utils/exercise";

interface DayPageProps {
  params: { id: string };
}

export default function DayPage({ params }: DayPageProps) {
  const router = useRouter();
  const dayId = params.id as DayId;
  const { setAnswer, markComplete, resetDay, percentDone, isComplete, wrongCount } = useProgress(dayId);
  const day = useMemo<WorkbookDay | undefined>(
    () => workbookDays.find((item) => item.id === params.id),
    [params.id],
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showReward, setShowReward] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (day) {
      logEvent("day_viewed", { dayId: day.id });
    }
  }, [day]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreviewAll(params.get("previewAll") === "1");
  }, []);

  useEffect(() => {
    if (!day) {
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
    const progress = loadProgressState();
    const previousProgress = progress.days[previousDay.id];
    setIsLocked(!canUnlockNextDay(previousDay, previousProgress));
  }, [day, previewAll]);

  useEffect(() => {
    if (!day) {
      return;
    }

    const saved = loadProgressState().days[day.id];
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
      acc[attempt.exerciseId] = (acc[attempt.exerciseId] ?? 0) + 1;
      return acc;
    }, {});
    setAttempts(attemptsByExercise);
  }, [day]);

  if (!day) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-5xl">🔍</p>
          <p className="mb-4 text-lg font-semibold text-gray-700">הַיּוֹם לֹא נִמְצָא.</p>
          <Link
            href={previewAll ? "/?previewAll=1" : "/"}
            className="touch-button mt-2 inline-block rounded-2xl bg-violet-400 px-6 py-3 font-semibold text-white shadow-sm"
          >
            🏠 חֲזָרָה לַבַּיִת
          </Link>
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
            href={previewAll ? "/?previewAll=1" : "/"}
            className="touch-button inline-block rounded-2xl bg-violet-400 px-6 py-3 font-semibold text-white shadow-sm"
          >
            🏠 חֲזוֹר הַבַּיְתָה
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
    const success = isAnswerCorrect(exercise, userAnswer);
    setCorrectMap((prev) => ({ ...prev, [exercise.id]: success }));
    const nextAttempt = (attempts[exercise.id] ?? 0) + 1;
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

    if (!success && wrongCount + 1 >= MAX_DAILY_WRONG_ANSWERS) {
      resetDay();
      setAnswers({});
      setCorrectMap({});
      setFeedback({});
      setAttempts({});
      setShowReward(false);
      setResetNotice("הִגַּעַתְּ לְ-10 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ.");
    }
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
      {/* Sticky progress header */}
      <div className="progress-sticky px-4 py-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600">📊 הַהִתְקַדְּמוּת שֶׁלִּי:</p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${passThreshold}%`} />
        <div className="mt-2 flex items-center justify-between gap-4">
          <Link
            href={previewAll ? "/?previewAll=1" : "/"}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100"
          >
            ← חֲזוֹר לָרָאשִׁי
          </Link>
          <div className="error-counter-badge items-center gap-1 px-4 py-1.5 text-sm font-semibold" aria-live="polite">
            💥 {wrongCount}/{MAX_DAILY_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      {/* Day header */}
      <div className="mb-4 mt-2">
        <DayHeader day={day} />
      </div>

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
          <p className="mb-4 text-sm font-semibold text-emerald-700">הַיּוֹם הוּשְׁלַם בְּהַצְלָחָה — עָשִׂיתָ עֲבוֹדָה מְצוּיֶנֶת!</p>
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

      <StarReward visible={showReward} onConfirm={() => router.push(previewAll ? "/?previewAll=1" : "/")} />
    </main>
  );
}
