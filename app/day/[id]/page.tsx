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
      <main>
        <div className="surface p-4">
          <p>הַיּוֹם לֹא נִמְצָא.</p>
          <Link href={previewAll ? "/?previewAll=1" : "/"} className="touch-button mt-3 inline-block">
            חֲזָרָה לַבַּיִת
          </Link>
        </div>
      </main>
    );
  }

  if (isLocked) {
    return (
      <main>
        <div className="surface p-4">
          <p>הַיּוֹם עֲדַיִן נָעוּל. צָרִיךְ לְהַשְׁלִים אֶת הַיּוֹם הַקּוֹדֵם בְּ-100%.</p>
          <Link href={previewAll ? "/?previewAll=1" : "/"} className="touch-button mt-3 inline-block">
            חֲזָרָה לַבַּיִת
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
      setResetNotice("הִגַּעַתְּ לְ-10 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ.");
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
      <div className="progress-sticky">
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${passThreshold}%`} />
        <div className="mt-2 flex justify-end">
          <div className="error-counter-badge" aria-live="polite">
            טָעוּיוֹת: {wrongCount}/{MAX_DAILY_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <Link
          href={previewAll ? "/?previewAll=1" : "/"}
          className="touch-button inline-block bg-white font-semibold"
        >
          חֲזוֹר לָרָאשִׁי
        </Link>
      </div>

      <DayHeader day={day} />

      {resetNotice ? (
        <div className="surface mb-3 border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          {resetNotice}
        </div>
      ) : null}

      {day.sections.map((section) => (
        <SectionBlock
          key={section.id}
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
      ))}

      <div className="surface mb-4 p-4">
        <p className="text-sm">
          צִיּוֹן נוֹכְחִי: <strong>{Math.round(percentDone)}%</strong>
        </p>
        {!canComplete ? (
          <p className="mt-2 text-sm text-rose-700">
            כְּדֵי לְהַשְׁלִים יוֹם צָרִיךְ 100%. כָּרֶגַע חֲסֵרִים עוֹד{" "}
            {Math.max(0, Math.ceil(passThreshold - percentDone))}%.
          </p>
        ) : null}
        <button
          type="button"
          className={`touch-button mt-3 ${canComplete ? "btn-accent" : "btn-disabled"} ${
            isComplete ? "opacity-80" : ""
          }`}
          onClick={completeDay}
          disabled={!canComplete}
        >
          {isComplete ? "הַיּוֹם הוּשְׁלַם" : "סִיּוּם יוֹם"}
        </button>
      </div>

      <StarReward visible={showReward} onConfirm={() => router.push(previewAll ? "/?previewAll=1" : "/")} />
    </main>
  );
}
