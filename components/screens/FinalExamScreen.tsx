"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExerciseBox } from "@/components/ExerciseBox";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import {
  FINAL_EXAM_DAY_ID,
  FINAL_EXAM_PASS_PERCENT,
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
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

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
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const [state, setState] = useState<FinalExamState | null>(null);

  useEffect(() => {
    const existing = loadFinalExamState(grade);
    if (existing) {
      setState(existing);
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
  const focusNextInput = (currentId: string) => {
    const currentIndex = exerciseOrder.findIndex((id) => id === currentId);
    const nextId = exerciseOrder[currentIndex + 1];
    if (!nextId) return;
    refs.current[nextId]?.focus();
  };

  const persist = (next: FinalExamState) => {
    saveFinalExamState(grade, next);
    setState(next);
  };

  const onChange = (exerciseId: ExerciseId, value: string) => {
    if (!state) return;
    persist({
      ...state,
      answers: { ...state.answers, [exerciseId]: value },
    });
  };

  const submitExercise = (exercise: Exercise) => {
    if (!state) return;
    if (state.submittedAt) return;
    const userAnswer = state.answers[exercise.id] ?? "";
    const normalizedAnswer = normalizeAnswerValue(userAnswer);
    const previousAttempts = state.attempts[exercise.id] ?? 0;
    if (normalizedAnswer === null) {
      // keep feedback by marking incorrect; no attempt increment
      persist({
        ...state,
        correctMap: { ...state.correctMap, [exercise.id]: false },
      });
      return;
    }

    const success = isAnswerCorrect(exercise, userAnswer);
    const nextAttempt = previousAttempts + 1;
    persist({
      ...state,
      attempts: { ...state.attempts, [exercise.id]: nextAttempt },
      correctMap: { ...state.correctMap, [exercise.id]: success },
    });
  };

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
    setState(initial);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishExam = async () => {
    if (!state) return;
    if (!canFinish) return;
    const nextCorrectMap: Record<ExerciseId, boolean> = { ...state.correctMap };
    for (const ex of selectedExercises) {
      const raw = state.answers[ex.id] ?? "";
      nextCorrectMap[ex.id] = isAnswerCorrect(ex, raw);
    }
    const nextCorrectCount = state.selectedExerciseIds.filter((id) => nextCorrectMap[id]).length;
    const scorePercent = Math.round((nextCorrectCount / FINAL_EXAM_QUESTION_COUNT) * 100);
    const passed = scorePercent >= FINAL_EXAM_PASS_PERCENT;
    const next: FinalExamState = {
      ...state,
      correctMap: nextCorrectMap,
      submittedAt: new Date().toISOString(),
      scorePercent,
      passed,
    };
    persist(next);

    if (passed && grade === "a") {
      await fetch("/api/unlock-grade-b", { method: "POST" }).catch(() => null);
    }
  };

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-5xl">⏳</p>
          <p className="text-lg font-semibold text-gray-700">טוֹעֲנִים אֶת הַמִּבְחָן...</p>
        </div>
      </main>
    );
  }

  const showResults = Boolean(state.submittedAt);
  const scorePercent = state.scorePercent ?? 0;
  const passed = Boolean(state.passed);

  if (isLocked === null) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים אֶת הַמִּבְחָן..." />
      </main>
    );
  }

  if (isLocked) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <p className="mb-2 text-6xl">🔒</p>
          <p className="mb-2 text-xl font-semibold text-gray-800">המבחן נעול</p>
          <p className="mb-6 text-sm text-gray-500">
            {grade === "a"
              ? "צריך להשלים את כיתה א׳ עד הסוף כדי לפתוח את המבחן המסכם."
              : "צריך להשלים את כל ימי הלימוד הקודמים כדי לפתוח את המבחן המסכם."}
          </p>
          <Link
            href={routes.gradeHome(grade, { previewAll })}
            className="touch-button inline-block rounded-2xl bg-violet-400 px-6 py-3 font-semibold text-white shadow-sm"
          >
            חזרה לחוברת
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <AppNavLink href={routes.gradeHome(grade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
      </div>

      <header className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm">
        <h1 className="text-xl font-bold text-slate-900">
          מִבְחָן מְסַכֵּם — כִּיתָּה {gradeLabel(grade)}
        </h1>
        <p className="muted mt-1 text-sm">
          עָנִיתָ עַל {answeredCount} מִתּוֹךְ {FINAL_EXAM_QUESTION_COUNT}
        </p>
        <div className="mt-3">
          <ProgressBar value={percentAnswered} label="הִתְקַדְּמוּת בַּמִּבְחָן" />
        </div>
      </header>

      <SectionBlock
        title="שְׁאֵלוֹת הַמִּבְחָן"
        type="review"
        learningGoal="פּוֹתְרִים שְׁאֵלוֹת מִבַּנְק שֶׁמִּתְחַלֵּף. בְּסוֹף — לָחֲצוּ ״סיימתי״ לְקַבֵּל צִיּוֹן."
      >
        {selectedExercises.map((exercise) => {
          const value = state.answers[exercise.id] ?? "";
          const attempts = state.attempts[exercise.id] ?? 0;
          const wasChecked = exercise.id in state.correctMap;
          const isCorrect = state.correctMap[exercise.id];
          const retryMessage = wasChecked ? getRetryFeedbackText(exercise, value, attempts) : undefined;

          return (
            <div
              key={exercise.id}
              ref={(el) => {
                refs.current[exercise.id] = (el?.querySelector("input") as HTMLInputElement | null) ?? null;
              }}
            >
              <ExerciseBox
                exercise={exercise}
                value={value}
                wasChecked={wasChecked}
                isCorrect={isCorrect}
                retryMessage={retryMessage}
                onChange={(v) => {
                  if (showResults) return;
                  onChange(exercise.id, v);
                }}
                onSubmit={() => {
                  if (showResults) return;
                  submitExercise(exercise);
                }}
                onNextInput={() => focusNextInput(exercise.id)}
                onRetry={() => {
                  if (showResults) return;
                  onChange(exercise.id, "");
                }}
              />
            </div>
          );
        })}
      </SectionBlock>

      <div className="surface mt-4 rounded-3xl p-5">
        {!showResults ? (
          canFinish ? (
            <button type="button" className="touch-button btn-accent mt-2 w-full" onClick={finishExam}>
              סיימתי
            </button>
          ) : (
            <p className="muted mt-2 text-sm">
              נשארו עוד {FINAL_EXAM_QUESTION_COUNT - answeredCount} שאלות כדי לקבל ציון.
            </p>
          )
        ) : null}

        {showResults ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-lg font-bold text-slate-900">ציון: {scorePercent}%</p>
            <p className={`mt-1 text-sm font-semibold ${passed ? "text-emerald-700" : "text-rose-700"}`}>
              {passed
                ? grade === "a"
                  ? "עברת! אפשר להתחיל כיתה ב׳."
                  : "עברת את המבחן המסכם לכיתה ב׳!"
                : "לא עבר — אפשר להיבחן שוב."}
            </p>
            <p className="muted mt-2 text-sm">
              נכון: {correctCount} | לא נכון: {FINAL_EXAM_QUESTION_COUNT - correctCount}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passed ? (
                grade === "a" ? (
                  <button
                    type="button"
                    className="touch-button btn-accent w-full"
                    onClick={() => router.push(routes.gradeHome("b"))}
                  >
                    להתחיל כיתה ב׳
                  </button>
                ) : (
                  <button
                    type="button"
                    className="touch-button btn-accent w-full"
                    onClick={() => router.push(routes.gradePicker())}
                  >
                    חזרה לבחירת כיתה
                  </button>
                )
              ) : (
                <button type="button" className="touch-button btn-accent w-full" onClick={retryExam}>
                  להיבחן שוב
                </button>
              )}
              <Link
                href={routes.gradeHome(grade, { previewAll })}
                className="touch-button inline-block w-full rounded-2xl border-2 border-slate-200 bg-white px-6 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
              >
                חזרה לחוברת
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

