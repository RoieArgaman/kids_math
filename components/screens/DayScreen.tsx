"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayHeader } from "@/components/DayHeader";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { FinalExamScreen } from "@/components/screens/FinalExamScreen";
import { StarReward } from "@/components/StarReward";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { logEvent } from "@/lib/analytics/events";
import { useBadges } from "@/lib/hooks/useBadges";
import { LEARNING_ROUTINE_STEPS } from "@/lib/content/curriculum-plan";
import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { COMPLETION_GATE_PERCENT, MAX_DAILY_WRONG_ANSWERS } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayAnswers } from "@/lib/hooks/useDayAnswers";
import { useDayReset } from "@/lib/hooks/useDayReset";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { useDayUnlockStatus } from "@/lib/hooks/useDayUnlockStatus";
import { isAnswerCorrect } from "@/lib/utils/exercise";
import { formatMs } from "@/lib/utils/formatMs";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, Exercise, WorkbookDay } from "@/lib/types";

export function DayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  if (dayId === FINAL_EXAM_DAY_ID) {
    return <FinalExamScreen grade={effectiveGrade} />;
  }
  return <RegularDayScreen grade={effectiveGrade} dayId={dayId} />;
}

function RegularDayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const router = useRouter();
  const {
    setAnswer,
    markComplete,
    resetDay,
    improveBestTime,
    percentDone,
    isComplete,
    wrongCount,
    completedAt,
    firstAttemptedAt,
    bestTimeMs,
  } = useProgress(dayId, {
    grade,
  });
  const day = useMemo<WorkbookDay | undefined>(
    () => getWorkbookDays(grade).find((item) => item.id === dayId),
    [dayId, grade],
  );
  const { previewAll, isRouteReady, isLocked } = useDayUnlockStatus({ grade, dayId });

  const [showReward, setShowReward] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  // Incremented each time a speed-run sets a new record so useBadges re-evaluates
  // speed badges even though isComplete hasn't changed.
  const [badgeEvalCounter, setBadgeEvalCounter] = useState(0);
  const { newlyUnlockedIds, markAllSeen } = useBadges(grade, {
    evaluateTrigger: isComplete,
    evaluateCounter: badgeEvalCounter,
  });

  const allExercises = useMemo(
    () => (day ? day.sections.flatMap((section) => section.exercises) : []),
    [day],
  );

  const { answers, correctMap, feedback, attempts, wrongAttempts, hintUsed, resetAnswerState, onChangeValue, onRetryExercise, onRevealHint, submitExercise } =
    useDayAnswers({
      day,
      grade,
      allExercisesCount: allExercises.length,
      setAnswer,
    });

  const handleReset = useCallback(() => {
    resetAnswerState();
    setShowReward(false);
  }, [resetAnswerState]);

  const { resetNotice } = useDayReset({ wrongCount, resetDay, onReset: handleReset });

  const { focusNextInput, setFocusRef } = useExerciseFocus(allExercises);

  // Speed-run state
  const [isSpeedRun, setIsSpeedRun] = useState(false);
  const [speedRunStartMs, setSpeedRunStartMs] = useState<number | null>(null);
  const [speedRunCorrect, setSpeedRunCorrect] = useState<Record<string, boolean>>({});
  const [speedRunAnswers, setSpeedRunAnswers] = useState<Record<string, string>>({});
  const [speedRunResult, setSpeedRunResult] = useState<{
    elapsedMs: number;
    isNewRecord: boolean;
    prevBestMs: number | null;
  } | null>(null);
  const [liveTimerMs, setLiveTimerMs] = useState(0);

  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (day) {
      logEvent("day_viewed", { dayId: day.id, payload: { grade } });
    }
  }, [day, grade]);

  // Live timer effect
  useEffect(() => {
    if (!isSpeedRun || speedRunStartMs === null) return;
    const interval = setInterval(() => {
      setLiveTimerMs(Date.now() - speedRunStartMs);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpeedRun, speedRunStartMs]);

  useEffect(() => {
    if (isSpeedRun) {
      return;
    }
    if (!firstAttemptedAt) {
      return;
    }
    if (percentDone >= 100) {
      return;
    }
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isSpeedRun, firstAttemptedAt, percentDone]);

  const headerSessionMs = useMemo(() => {
    if (isSpeedRun) {
      return null;
    }
    if (!firstAttemptedAt) {
      return null;
    }
    const start = new Date(firstAttemptedAt).getTime();
    if (percentDone >= 100 && completedAt) {
      return Math.max(0, new Date(completedAt).getTime() - start);
    }
    return Math.max(0, nowTick - start);
  }, [isSpeedRun, firstAttemptedAt, percentDone, completedAt, nowTick]);

  const submitSpeedRunExercise = useCallback(
    (exercise: Exercise) => {
      const userAnswer = speedRunAnswers[exercise.id] ?? "";
      const correct = isAnswerCorrect(exercise, userAnswer);
      const nextCorrect = { ...speedRunCorrect, [exercise.id]: correct };
      setSpeedRunCorrect(nextCorrect);
      const allDone =
        allExercises.length > 0 &&
        allExercises.every((ex) => nextCorrect[ex.id] === true);
      if (allDone && speedRunStartMs !== null) {
        const elapsed = Date.now() - speedRunStartMs;
        const prevBest = bestTimeMs ?? null;
        const isNewRecord = prevBest === null || elapsed < prevBest;
        if (isNewRecord) {
          improveBestTime(elapsed);
          setBadgeEvalCounter((c) => c + 1);
        }
        setSpeedRunResult({ elapsedMs: elapsed, isNewRecord, prevBestMs: prevBest });
        setIsSpeedRun(false);
        setSpeedRunStartMs(null);
      }
    },
    [allExercises, speedRunCorrect, speedRunStartMs, bestTimeMs, improveBestTime, speedRunAnswers],
  );

  if (!day) {
    return (
      <main data-testid={testIds.screen.day.root(grade, `${dayId}.not-found`)}>
        <CenteredPanel
          data-testid={childTid(testIds.screen.day.root(grade, `${dayId}.not-found`), "panel")}
          emoji="🔍"
          title="הַיּוֹם לֹא נִמְצָא."
          actions={
            <ButtonLink
              data-testid={childTid(testIds.screen.day.root(grade, `${dayId}.not-found`), "cta", "home")}
              href={routes.gradeHome(grade, { previewAll })}
              className="w-full text-center"
            >
              חֲזָרָה לַחוֹבֶרֶת
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (!isRouteReady || isLocked === null) {
    return (
      <main data-testid={testIds.screen.day.root(grade, `${dayId}.loading`)} className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים אֶת הַיּוֹם..." />
      </main>
    );
  }

  if (isLocked) {
    return (
      <main data-testid={testIds.screen.day.root(grade, `${dayId}.locked`)}>
        <CenteredPanel
          data-testid={childTid(testIds.screen.day.root(grade, `${dayId}.locked`), "panel")}
          emoji="🔒"
          title="הַיּוֹם נָעוּל"
          description="צָרִיךְ לְהַשְׁלִים אֶת הַיּוֹם הַקּוֹדֵם בְּ-100% כְּדֵי לִפְתֹּחַ אֶת הַיּוֹם הַזֶּה."
          actions={
            <ButtonLink
              data-testid={childTid(testIds.screen.day.root(grade, `${dayId}.locked`), "cta", "home")}
              href={routes.gradeHome(grade, { previewAll })}
              className="w-full text-center"
            >
              חֲזוֹר הַבַּיְתָה
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const passThreshold = COMPLETION_GATE_PERCENT;
  const canComplete = percentDone >= passThreshold;

  const completeDay = () => {
    const passed = markComplete();
    if (!passed) {
      return;
    }
    setShowReward(true);
  };

  return (
    <main data-testid={testIds.screen.day.root(grade, dayId)}>
      <div data-testid={testIds.screen.day.nav(grade, dayId)} className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <AppNavLink href={routes.gradeHome(grade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
        <AppNavLink href={routes.gradePicker({ previewAll })}>חזרה לבחירת כיתה</AppNavLink>
      </div>

      {/* Sticky progress header */}
      <div data-testid={testIds.screen.day.stickyHeader(grade, dayId)} className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <p data-testid={childTid(testIds.screen.day.stickyHeader(grade, dayId), "label")} className="mb-1 text-xs font-semibold text-gray-600">
          📊 הַהִתְקַדְּמוּת שֶׁלִּי:
        </p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${passThreshold}%`} />
        <div data-testid={childTid(testIds.screen.day.stickyHeader(grade, dayId), "row")} className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div data-testid={childTid(testIds.screen.day.stickyHeader(grade, dayId), "links")} className="flex min-w-0 flex-1 flex-wrap gap-2 sm:flex-none">
            <Link
              href={routes.gradeHome(grade, { previewAll })}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 sm:flex-none sm:px-4"
            >
              חֲזוֹר לָרָאשִׁי
            </Link>
            <Link
              href={routes.gradePlan(grade, { previewAll })}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 shadow-sm transition-colors hover:bg-violet-100 sm:flex-none sm:px-4"
            >
              תּוֹכְנִית לִמּוּדִים
            </Link>
          </div>
          <div data-testid={childTid(testIds.screen.day.stickyHeader(grade, dayId), "wrongBadge")}
            className="error-counter-badge w-full items-center gap-1 px-4 py-1.5 text-sm font-semibold sm:w-auto"
            aria-live="polite"
          >
            💥 {wrongCount}/{MAX_DAILY_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      {/* Day header */}
      <div data-testid={childTid(testIds.screen.day.root(grade, dayId), "header")} className="mb-4 mt-2">
        <DayHeader
          day={day}
          rootTestId={testIds.screen.day.dayHeader(grade, dayId)}
          showSessionTimer={!isSpeedRun && Boolean(firstAttemptedAt)}
          sessionTimerMs={headerSessionMs}
          sessionTimerTestId={childTid(testIds.screen.day.dayHeader(grade, dayId), "sessionTimer")}
        />
      </div>

      <details data-testid={testIds.screen.day.howWeWork(grade, dayId)} className="surface mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm shadow-sm">
        <summary data-testid={childTid(testIds.screen.day.howWeWork(grade, dayId), "summary")} className="cursor-pointer select-none font-semibold text-violet-900">
          אֵיךְ נַעֲבוֹד הַיּוֹם? (אַרְבַּעָה שְׁלָבִים)
        </summary>
        <ol data-testid={childTid(testIds.screen.day.howWeWork(grade, dayId), "steps")} className="mt-3 list-decimal list-inside space-y-2 pr-1 leading-relaxed text-slate-700">
          {LEARNING_ROUTINE_STEPS.map((step, i) => (
            <li data-testid={childTid(testIds.screen.day.howWeWork(grade, dayId), "step", i)} key={i}>
              {step}
            </li>
          ))}
        </ol>
      </details>

      {/* Reset notice */}
      {resetNotice ? (
        <div data-testid={testIds.screen.day.resetNotice(grade, dayId)} className="mb-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
          ⚠️ {resetNotice}
        </div>
      ) : null}

      {/* Speed-run banner */}
      {isSpeedRun && (
        <div data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunBanner")} className="mb-4 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-center font-bold text-amber-900" dir="rtl">
          🏃 מצב מהירות — ענה על כל השאלות מחדש!
          <span data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunBanner", "timer")} className="ml-4 font-mono text-amber-700">⏱️ {formatMs(liveTimerMs)}</span>
        </div>
      )}

      {/* Sections */}
      {day.sections.map((section) => (
        <div data-testid={childTid(testIds.screen.day.root(grade, dayId), "sectionWrap", section.id)} key={section.id} className="mb-6">
          <SectionBlock
            sectionId={section.id}
            data-testid={childTid(testIds.screen.day.root(grade, dayId), "section", section.id)}
            title={section.title}
            learningGoal={section.learningGoal}
            type={section.type}
            example={section.example}
          >
            {section.exercises.map((exercise) => (
              <ExerciseItem
                screenRootTestId={testIds.screen.day.root(grade, dayId)}
                key={exercise.id}
                exercise={exercise}
                value={isSpeedRun ? (speedRunAnswers[exercise.id] ?? "") : (answers[exercise.id] ?? "")}
                retryMessage={isSpeedRun ? undefined : feedback[exercise.id]}
                isCorrect={isSpeedRun ? (speedRunCorrect[exercise.id] === true ? true : undefined) : correctMap[exercise.id]}
                wasChecked={isSpeedRun ? (speedRunCorrect[exercise.id] !== undefined) : (attempts[exercise.id] ?? 0) > 0}
                setFocusRef={setFocusRef}
                wrongAttempts={isSpeedRun ? 0 : (wrongAttempts[exercise.id] ?? 0)}
                hintUsed={isSpeedRun ? false : (hintUsed[exercise.id] ?? false)}
                onRevealHint={isSpeedRun ? () => {} : onRevealHint}
                onChangeValue={isSpeedRun ? (exerciseId, value) => setSpeedRunAnswers((prev) => ({ ...prev, [exerciseId]: value })) : onChangeValue}
                onSubmitExercise={isSpeedRun ? submitSpeedRunExercise : submitExercise}
                onNextInput={focusNextInput}
                onRetryExercise={isSpeedRun ? () => {} : onRetryExercise}
              />
            ))}
          </SectionBlock>
        </div>
      ))}

      {/* Completion panel */}
      {isComplete && canComplete ? (
        <div data-testid={testIds.screen.day.completionPanel(grade, dayId)} className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-100 to-green-200 p-6 text-center shadow-md border border-emerald-200">
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "icon")} className="mb-1 text-5xl">✅</p>
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "title")} className="mb-1 text-2xl font-semibold text-emerald-900">כָּל הַכָּבוֹד!</p>
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "subtitle")} className="mb-4 text-sm font-semibold text-emerald-700">
            הַיּוֹם הוּשְׁלַם בְּהַצְלָחָה — עָשִׂיתָ עֲבוֹדָה מְצוּיֶנֶת!
          </p>
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "score")} className="mb-4 text-base font-semibold text-emerald-900">
            צִיּוֹן: <strong data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "scoreValue")}>{Math.round(percentDone)}%</strong>
          </p>
          <button
            data-testid={testIds.screen.day.completeCta(grade, dayId)}
            type="button"
            className="touch-button btn-accent w-full rounded-2xl py-4 text-lg font-semibold shadow-md opacity-80"
            onClick={completeDay}
          >
            הַיּוֹם הוּשְׁלַם ✨
          </button>
        </div>
      ) : isComplete && !canComplete ? (
        <div data-testid={testIds.screen.day.completionPanel(grade, dayId)} className="surface mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "blockedTitle")} className="mb-3 text-sm font-semibold text-amber-800">
            ⚠️ הַיּוֹם סוּמַּן כְּהוּשְׁלַם אַךְ הַצִּיּוֹן נָמוּךְ מִ-{passThreshold}%.
          </p>
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "score")} className="mb-4 text-base font-semibold text-amber-900">
            צִיּוֹן נוֹכְחִי: <strong data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "scoreValue")}>{Math.round(percentDone)}%</strong>
          </p>
          <button
            data-testid={testIds.screen.day.completeCta(grade, dayId)}
            type="button"
            className="touch-button btn-disabled w-full rounded-2xl py-4 text-lg font-semibold opacity-80"
            onClick={completeDay}
            disabled={!canComplete}
          >
            הַיּוֹם הוּשְׁלַם
          </button>
        </div>
      ) : (
        <div data-testid={testIds.screen.day.completionPanel(grade, dayId)} className="surface mb-6 rounded-2xl p-5 shadow-sm">
          <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "score")} className="text-base font-semibold">
            צִיּוֹן נוֹכְחִי: <strong data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "scoreValue")}>{Math.round(percentDone)}%</strong>
          </p>
          {!canComplete ? (
            <p data-testid={childTid(testIds.screen.day.completionPanel(grade, dayId), "hint")} className="mt-2 text-sm font-semibold text-rose-700">
              כְּדֵי לְהַשְׁלִים יוֹם צָרִיךְ 100%. כָּרֶגַע חֲסֵרִים עוֹד{" "}
              {Math.max(0, Math.ceil(passThreshold - percentDone))}%.
            </p>
          ) : null}
          <button
            data-testid={testIds.screen.day.completeCta(grade, dayId)}
            type="button"
            className={`touch-button mt-4 w-full rounded-2xl py-4 text-lg font-semibold shadow-md ${canComplete ? "btn-accent" : "btn-disabled"
              }`}
            onClick={completeDay}
            disabled={!canComplete}
          >
            סִיּוּם יוֹם 🎉
          </button>
        </div>
      )}

      {/* Beat Your Time panel */}
      {isComplete && !isSpeedRun && speedRunResult === null && (
        <div data-testid={childTid(testIds.screen.day.root(grade, dayId), "beatYourTimePanel")} className="mb-6 rounded-3xl border border-violet-200 bg-violet-50 p-5 text-center shadow-sm" dir="rtl">
          {bestTimeMs !== undefined && (
            <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "beatYourTimePanel", "bestTime")} className="mb-2 text-sm font-semibold text-violet-700">
              ⏱️ הזמן הכי טוב שלך: <strong data-testid={childTid(testIds.screen.day.root(grade, dayId), "beatYourTimePanel", "bestTime", "value")}>{formatMs(bestTimeMs)}</strong>
            </p>
          )}
          <button
            data-testid={childTid(testIds.screen.day.root(grade, dayId), "beatYourTimePanel", "startCta")}
            type="button"
            className="touch-button w-full rounded-2xl bg-violet-600 py-4 text-lg font-semibold text-white shadow-md hover:bg-violet-700 active:bg-violet-800"
            onClick={() => {
              setSpeedRunCorrect({});
              setSpeedRunAnswers({});
              setSpeedRunResult(null);
              setSpeedRunStartMs(Date.now());
              setLiveTimerMs(0);
              setIsSpeedRun(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            🏃 נסה לשפר את הזמן!
          </button>
        </div>
      )}

      {/* Speed-run result panel */}
      {isComplete && speedRunResult !== null && (
        <div
          data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult")}
          className={`mb-6 rounded-3xl p-5 text-center shadow-md border ${
            speedRunResult.isNewRecord
              ? "bg-emerald-50 border-emerald-300"
              : "bg-amber-50 border-amber-300"
          }`}
          dir="rtl"
        >
          {speedRunResult.isNewRecord ? (
            <>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "newRecord", "icon")} className="text-3xl mb-1">🏆</p>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "newRecord", "title")} className="text-lg font-extrabold text-emerald-800 mb-1">שיא חדש!</p>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "newRecord", "desc")} className="text-sm font-semibold text-emerald-700">
                הזמן שלך: <strong data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "newRecord", "time")}>{formatMs(speedRunResult.elapsedMs)}</strong>
                {speedRunResult.prevBestMs !== null && (
                  <span data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "newRecord", "prevBest")} className="text-emerald-600"> (שיפרת מ-{formatMs(speedRunResult.prevBestMs)})</span>
                )}
              </p>
            </>
          ) : (
            <>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "goodTry", "icon")} className="text-3xl mb-1">😊</p>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "goodTry", "title")} className="text-lg font-extrabold text-amber-800 mb-1">ניסיון טוב!</p>
              <p data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "goodTry", "desc")} className="text-sm font-semibold text-amber-700">
                הזמן שלך: <strong data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "goodTry", "time")}>{formatMs(speedRunResult.elapsedMs)}</strong>
                {speedRunResult.prevBestMs !== null && (
                  <span data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "goodTry", "prevBest")}> (השיא הוא: {formatMs(speedRunResult.prevBestMs)})</span>
                )}
              </p>
            </>
          )}
          <div data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "actions")} className="mt-4 flex gap-3 justify-center">
            <button
              data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "retryCta")}
              type="button"
              className="touch-button rounded-2xl border border-violet-300 bg-white px-5 py-3 text-sm font-semibold text-violet-700"
              onClick={() => {
                setSpeedRunCorrect({});
                setSpeedRunAnswers({});
                setSpeedRunResult(null);
                setSpeedRunStartMs(Date.now());
                setLiveTimerMs(0);
                setIsSpeedRun(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              🔄 נסה שוב
            </button>
            <button
              data-testid={childTid(testIds.screen.day.root(grade, dayId), "speedRunResult", "homeCta")}
              type="button"
              className="touch-button rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
              onClick={() => router.push(routes.gradeHome(grade, { previewAll }))}
            >
              🏠 חזרה לבית
            </button>
          </div>
        </div>
      )}

      <StarReward
        visible={showReward}
        onConfirm={() => {
          if (newlyUnlockedIds.length > 0) {
            setShowReward(false);
            setShowTrophy(true);
          } else {
            router.push(routes.gradeHome(grade, { previewAll }));
          }
        }}
      />
      <TrophyUnlock
        visible={showTrophy}
        newBadgeIds={newlyUnlockedIds}
        onConfirm={() => {
          markAllSeen();
          router.push(routes.gradeHome(grade, { previewAll }));
        }}
      />
    </main>
  );
}
