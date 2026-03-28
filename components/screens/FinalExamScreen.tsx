"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ButtonLink } from "@/components/ui/Button";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import {
  FINAL_EXAM_DAY_ID,
  FINAL_EXAM_QUESTION_COUNT,
} from "@/lib/final-exam/config";
import { pickFinalExamExerciseIds } from "@/lib/final-exam/picker";
import {
  clearFinalExamState,
  createInitialFinalExamState,
  loadFinalExamState,
  saveFinalExamState,
} from "@/lib/final-exam/storage";
import type { FinalExamState } from "@/lib/final-exam/types";
import { gradeLabel, type GradeId } from "@/lib/grades";
import type { Exercise, ExerciseId } from "@/lib/types";
import { routes } from "@/lib/routes";
import { useDayUnlockStatus } from "@/lib/hooks/useDayUnlockStatus";
import { gradeFinalExam } from "@/lib/final-exam/grading";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
import { childTid, testIds } from "@/lib/testIds";

function createSeed(): string {
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `${Date.now()}-${Math.random()}`;
}

export function FinalExamScreen({ grade }: { grade: GradeId }) {
  const router = useRouter();
  const { previewAll, isLocked } = useDayUnlockStatus({ grade, dayId: FINAL_EXAM_DAY_ID });
  const refs = useRef<Partial<Record<ExerciseId, HTMLElement | null>>>({});
  const stateRef = useRef<FinalExamState | null>(null);

  const [state, setState] = useState<FinalExamState | null>(null);
  const [isUnlockingGradeB, setIsUnlockingGradeB] = useState(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const existing = loadFinalExamState(grade);
    if (existing) {
      const needsReset =
        !existing.submittedAt && Object.keys(existing.correctMap).length > 0;
      const cleaned = needsReset
        ? { ...existing, correctMap: {}, attempts: {} }
        : existing;
      if (needsReset) {
        saveFinalExamState(grade, cleaned);
      }
      setState(cleaned);
      return;
    }
    const seed = createSeed();
    const selectedExerciseIds = pickFinalExamExerciseIds({
      seed,
      pickerVersion: 1,
      count: FINAL_EXAM_QUESTION_COUNT,
      grade,
    });
    const initial = createInitialFinalExamState({ grade, selectedExerciseIds });
    saveFinalExamState(grade, initial);
    setState(initial);
  }, [grade]);

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const day of Object.values(getWorkbookDaysById(grade))) {
      if (day.id === FINAL_EXAM_DAY_ID) continue;
      for (const section of day.sections) {
        for (const ex of section.exercises) {
          map.set(ex.id, ex);
        }
      }
    }
    return map;
  }, [grade]);

  const selectedExercises = useMemo((): Exercise[] => {
    if (!state) return [];
    return state.selectedExerciseIds
      .map((id) => exerciseById.get(id))
      .filter((ex): ex is Exercise => Boolean(ex));
  }, [state, exerciseById]);

  const answeredCount = useMemo(() => {
    if (!state) return 0;
    return state.selectedExerciseIds.filter((id) => normalizeAnswerValue(state.answers[id]) !== null).length;
  }, [state]);

  const correctCount = useMemo(() => {
    if (!state) return 0;
    return state.selectedExerciseIds.filter((id) => state.correctMap[id]).length;
  }, [state]);

  const percentAnswered = state ? Math.round((answeredCount / FINAL_EXAM_QUESTION_COUNT) * 100) : 0;
  const canFinish = answeredCount === FINAL_EXAM_QUESTION_COUNT;

  const exerciseOrder = useMemo(() => selectedExercises.map((e) => e.id), [selectedExercises]);
  const focusNextInput = useCallback((currentId: ExerciseId) => {
    const currentIndex = exerciseOrder.findIndex((id) => id === currentId);
    const nextId = exerciseOrder[currentIndex + 1];
    if (!nextId) return;
    refs.current[nextId]?.focus();
  }, [exerciseOrder]);

  const setFocusRef = useCallback((exerciseId: ExerciseId, node: HTMLElement | null) => {
    refs.current[exerciseId] = node;
  }, []);

  const persist = useCallback((next: FinalExamState) => {
    saveFinalExamState(grade, next);
    setState(next);
  }, [grade]);

  const onChangeValue = useCallback((exerciseId: ExerciseId, value: string) => {
    const current = stateRef.current;
    if (!current || current.submittedAt) return;
    const nextCorrect = { ...current.correctMap };
    delete nextCorrect[exerciseId];
    persist({
      ...current,
      answers: { ...current.answers, [exerciseId]: value },
      correctMap: nextCorrect,
    });
  }, [persist]);

  const onRetryExercise = useCallback((exerciseId: ExerciseId) => {
    const current = stateRef.current;
    if (!current || current.submittedAt) return;
    const nextCorrect = { ...current.correctMap };
    delete nextCorrect[exerciseId];
    persist({
      ...current,
      answers: { ...current.answers, [exerciseId]: "" },
      correctMap: nextCorrect,
    });
  }, [persist]);

  const noopSubmitExercise: (exercise: Exercise) => void = useCallback(() => {
    /* Per-question checks disabled; grade via finish CTA only. */
  }, []);

  const retryExam = () => {
    clearFinalExamState(grade);
    const seed = createSeed();
    const selectedExerciseIds = pickFinalExamExerciseIds({
      seed,
      pickerVersion: 1,
      count: FINAL_EXAM_QUESTION_COUNT,
      grade,
    });
    const initial = createInitialFinalExamState({ grade, selectedExerciseIds });
    saveFinalExamState(grade, initial);
    stateRef.current = initial;
    setState(initial);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishExam = async () => {
    if (!state) return;
    const graded = gradeFinalExam({ selectedExercises, answers: state.answers });
    if (!graded.canFinish) return;
    const next: FinalExamState = {
      ...state,
      correctMap: graded.correctMap,
      submittedAt: new Date().toISOString(),
      scorePercent: graded.scorePercent,
      passed: graded.passed,
    };
    persist(next);

    if (graded.passed && grade === "a") {
      setIsUnlockingGradeB(true);
      try {
        const response = await fetch("/api/unlock-grade-b", { method: "POST" });
        if (!response.ok) {
          throw new Error(`unlock failed with status ${response.status}`);
        }
      } finally {
        setIsUnlockingGradeB(false);
      }
    }
  };

  if (!state) {
    return (
      <main data-testid={testIds.screen.finalExam.root(`${grade}.loading`)}>
        <CenteredPanel
          data-testid={childTid(testIds.screen.finalExam.root(`${grade}.loading`), "panel")}
          emoji="⏳"
          title="טוֹעֲנִים אֶת הַמִּבְחָן..."
        />
      </main>
    );
  }

  const showResults = Boolean(state.submittedAt);
  const scorePercent = state.scorePercent ?? 0;
  const passed = Boolean(state.passed);

  if (isLocked === null) {
    return (
      <main data-testid={testIds.screen.finalExam.root(`${grade}.unlock-loading`)} className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים אֶת הַמִּבְחָן..." />
      </main>
    );
  }

  if (isLocked) {
    return (
      <main data-testid={testIds.screen.finalExam.root(`${grade}.locked`)}>
        <CenteredPanel
          data-testid={childTid(testIds.screen.finalExam.root(`${grade}.locked`), "panel")}
          emoji="🔒"
          title="המבחן נעול"
          description={
            grade === "a"
              ? "צריך להשלים את כיתה א׳ עד הסוף כדי לפתוח את המבחן המסכם."
              : "צריך להשלים את כל ימי הלימוד הקודמים כדי לפתוח את המבחן המסכם."
          }
          actions={
            <ButtonLink
              data-testid={childTid(testIds.screen.finalExam.root(`${grade}.locked`), "cta", "home")}
              href={routes.gradeHome(grade, { previewAll })}
              className="w-full text-center"
            >
              חזרה לחוברת
            </ButtonLink>
          }
        />
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.finalExam.root(grade)} className="pb-10">
      <div data-testid={childTid(testIds.screen.finalExam.root(grade), "topNav")} className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <AppNavLink href={routes.gradeHome(grade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
      </div>

      <header data-testid={testIds.screen.finalExam.stickyHeader(grade)} className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <h1 data-testid={childTid(testIds.screen.finalExam.stickyHeader(grade), "title")} className="text-xl font-bold text-slate-900">
          מִבְחָן מְסַכֵּם — כִּיתָּה {gradeLabel(grade)}
        </h1>
        <p data-testid={childTid(testIds.screen.finalExam.stickyHeader(grade), "subtitle")} className="muted mt-1 text-sm">
          עָנִיתָ עַל {answeredCount} מִתּוֹךְ {FINAL_EXAM_QUESTION_COUNT}
        </p>
        <div data-testid={childTid(testIds.screen.finalExam.stickyHeader(grade), "progress")} className="mt-3">
          <ProgressBar value={percentAnswered} label="הִתְקַדְּמוּת בַּמִּבְחָן" />
        </div>
      </header>

      <SectionBlock
        sectionId="final-exam.questions"
        data-testid={childTid(testIds.screen.finalExam.root(grade), "section", "questions")}
        title="שְׁאֵלוֹת הַמִּבְחָן"
        type="review"
        learningGoal="פּוֹתְרִים שְׁאֵלוֹת מִבַּנְק שֶׁמִּתְחַלֵּף. בִּסְיוּם — לָחֲצוּ ״בְּדִיקָה״ כְּדֵי לִרְאוֹת מָה נָכוֹן וּמָה לֹא."
      >
        {selectedExercises.map((exercise) => {
          const value = state.answers[exercise.id] ?? "";
          const wasChecked = Boolean(showResults && exercise.id in state.correctMap);
          const isCorrect = state.correctMap[exercise.id];

          return (
            <ExerciseItem
              screenRootTestId={testIds.screen.finalExam.root(grade)}
              key={exercise.id}
              exercise={exercise}
              value={value}
              wasChecked={wasChecked}
              isCorrect={isCorrect}
              isReadOnly={showResults}
              showCheckButton={false}
              setFocusRef={setFocusRef}
              wrongAttempts={0}
              hintUsed={false}
              onRevealHint={() => undefined}
              onChangeValue={onChangeValue}
              onSubmitExercise={noopSubmitExercise}
              onNextInput={focusNextInput}
              onRetryExercise={onRetryExercise}
            />
          );
        })}
      </SectionBlock>

      <div data-testid={testIds.screen.finalExam.finishPanel(grade)} className="surface mt-4 rounded-3xl p-5">
        {!showResults ? (
          canFinish ? (
            <button
              data-testid={testIds.screen.finalExam.finishCta(grade)}
              type="button"
              className="touch-button btn-accent mt-2 w-full"
              onClick={finishExam}
            >
              בְּדִיקָה
            </button>
          ) : (
            <p data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "hint")} className="muted mt-2 text-sm">
              נשארו עוד {FINAL_EXAM_QUESTION_COUNT - answeredCount} שאלות כדי לקבל ציון.
            </p>
          )
        ) : null}

        {showResults ? (
          <div
            data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "results")}
            className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "results", "score")} className="text-lg font-bold text-slate-900">
              ציון: {scorePercent}%
            </p>
            <p
              data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "results", "status")}
              className={`mt-1 text-sm font-semibold ${passed ? "text-emerald-700" : "text-rose-700"}`}
            >
              {passed
                ? grade === "a"
                  ? "עברת! אפשר להתחיל כיתה ב׳."
                  : "עברת את המבחן המסכם לכיתה ב׳!"
                : "לא עבר — אפשר להיבחן שוב."}
            </p>
            <p data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "results", "breakdown")} className="muted mt-2 text-sm">
              נכון: {correctCount} | לא נכון: {FINAL_EXAM_QUESTION_COUNT - correctCount}
            </p>
            <div data-testid={childTid(testIds.screen.finalExam.finishPanel(grade), "results", "ctas")} className="mt-3 grid gap-2 sm:grid-cols-2">
              {passed ? (
                grade === "a" ? (
                  <button
                    data-testid={testIds.screen.finalExam.startGradeB()}
                    type="button"
                    className={`touch-button w-full ${isUnlockingGradeB ? "btn-disabled" : "btn-accent"}`}
                    disabled={isUnlockingGradeB}
                    onClick={() => router.push(routes.gradeHome("b"))}
                  >
                    {isUnlockingGradeB ? "פותחים את כיתה ב׳..." : "להתחיל כיתה ב׳"}
                  </button>
                ) : (
                  <button
                    data-testid={testIds.screen.finalExam.gradePicker()}
                    type="button"
                    className="touch-button btn-accent w-full"
                    onClick={() => router.push(routes.gradePicker())}
                  >
                    חזרה לבחירת כיתה
                  </button>
                )
              ) : (
                <button
                  data-testid={testIds.screen.finalExam.retryCta(grade)}
                  type="button"
                  className="touch-button btn-accent w-full"
                  onClick={retryExam}
                >
                  להיבחן שוב
                </button>
              )}
              <Link
                href={routes.gradeHome(grade, { previewAll })}
                className="touch-button inline-block w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
              >
                חזרה לחוברת
              </Link>
              {passed ? (
                <Link
                  data-testid={testIds.screen.finalExam.gmatChallengeCta(grade)}
                  href={routes.gradeGmatChallenge(grade, { previewAll })}
                  className="touch-button col-span-full inline-block w-full rounded-2xl border-2 border-violet-200 bg-violet-50 px-6 py-3 text-center font-semibold text-violet-900 hover:bg-violet-100 sm:col-span-2"
                >
                  אתגר התנסות רשות (בהשראת GMAT Focus)
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

