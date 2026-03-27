"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { logEvent } from "@/lib/analytics/events";
import { LEARNING_ROUTINE_STEPS } from "@/lib/content/curriculum-plan";
import { getWorkbookDays } from "@/lib/content/workbook";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { COMPLETION_GATE_PERCENT, MAX_DAILY_WRONG_ANSWERS } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayUnlockStatus } from "@/lib/hooks/useDayUnlockStatus";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, Exercise, ExerciseId, WorkbookDay } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

export function DayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  if (dayId === FINAL_EXAM_DAY_ID) {
    return <FinalExamScreen grade={effectiveGrade} />;
  }
  return <RegularDayScreen grade={effectiveGrade} dayId={dayId} />;
}

function RegularDayScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const router = useRouter();
  const { setAnswer, markComplete, resetDay, percentDone, isComplete, wrongCount } = useProgress(dayId, {
    grade,
  });
  const day = useMemo<WorkbookDay | undefined>(
    () => getWorkbookDays(grade).find((item) => item.id === dayId),
    [dayId, grade],
  );
  const { previewAll, isRouteReady, isLocked } = useDayUnlockStatus({ grade, dayId });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showReward, setShowReward] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const resetNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (day) {
      logEvent("day_viewed", { dayId: day.id, payload: { grade } });
    }
  }, [day, grade]);

  // previewAll/isRouteReady/isLocked are derived via useDayUnlockStatus.

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

  const allExercises = useMemo(
    () => (day ? day.sections.flatMap((section) => section.exercises) : []),
    [day],
  );
  const allExercisesCount = allExercises.length;
  const answersRef = useRef(answers);
  const attemptsRef = useRef(attempts);

  useEffect(() => {
    answersRef.current = answers;
    attemptsRef.current = attempts;
  }, [answers, attempts]);

  const exerciseOrder = useMemo(() => allExercises.map((exercise) => exercise.id), [allExercises]);

  const focusNextInput = useCallback((currentId: string) => {
    const currentIndex = exerciseOrder.findIndex((id) => id === currentId);
    const nextId = exerciseOrder[currentIndex + 1];
    if (!nextId) {
      return;
    }
    refs.current[nextId]?.focus();
  }, [exerciseOrder]);

  const setFocusRef = useCallback((exerciseId: string, node: HTMLElement | null) => {
    refs.current[exerciseId] = node;
  }, []);

  const onChangeValue = useCallback((exerciseId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [exerciseId]: value,
    }));
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

  const submitExercise = useCallback((exercise: Exercise) => {
    const userAnswer = answersRef.current[exercise.id] ?? "";
    const normalizedAnswer = normalizeAnswerValue(userAnswer);
    const previousAttempts = attemptsRef.current[exercise.id] ?? 0;
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
      totalExercises: allExercisesCount,
    });
  }, [allExercisesCount, setAnswer]);

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
        <DayHeader day={day} />
      </div>

      <details data-testid={testIds.screen.day.howWeWork(grade, dayId)} className="surface mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4 text-sm shadow-sm">
        <summary data-testid={childTid(testIds.screen.day.howWeWork(grade, dayId), "summary")} className="cursor-pointer select-none font-semibold text-violet-900">
          אֵיךְ נַעֲבוֹד הַיּוֹם? (אַרְבַּעָה שְׁלָבִים)
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
                value={answers[exercise.id] ?? ""}
                retryMessage={feedback[exercise.id]}
                isCorrect={correctMap[exercise.id]}
                wasChecked={(attempts[exercise.id] ?? 0) > 0}
                setFocusRef={setFocusRef}
                onChangeValue={onChangeValue}
                onSubmitExercise={submitExercise}
                onNextInput={focusNextInput}
                onRetryExercise={onRetryExercise}
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

      <StarReward
        visible={showReward}
        onConfirm={() => router.push(routes.gradeHome(grade, { previewAll }))}
      />
    </main>
  );
}

