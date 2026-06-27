"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { StarReward } from "@/components/StarReward";
import { getEnglishDays, type EnglishLevel } from "@/lib/content/english-workbook";
import { englishLevelLabel } from "@/lib/english/levels";
import { loadEnglishProgressState } from "@/lib/english/storage";
import {
  ENGLISH_FINAL_EXAM_MIN_COUNT,
  ENGLISH_FINAL_EXAM_PASS_PERCENT,
} from "@/lib/english/final-exam/config";
import { buildEnglishExamBank, pickEnglishExamExerciseIds } from "@/lib/english/final-exam/picker";
import { gradeEnglishFinalExam } from "@/lib/english/final-exam/grading";
import {
  clearEnglishFinalExamState,
  createInitialEnglishFinalExamState,
  loadEnglishFinalExamState,
  saveEnglishFinalExamState,
} from "@/lib/english/final-exam/storage";
import type { EnglishFinalExamState } from "@/lib/english/final-exam/types";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { Exercise, ExerciseId } from "@/lib/types";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

function createSeed(): string {
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random()}`;
}

function allEnglishDaysComplete(level: EnglishLevel): boolean {
  const progress = loadEnglishProgressState();
  const days = getEnglishDays(level);
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete);
}

export function EnglishFinalExamScreen({ level }: { level: EnglishLevel }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [state, setState] = useState<EnglishFinalExamState | null>(null);
  const stateRef = useRef<EnglishFinalExamState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const ex of buildEnglishExamBank(level)) map.set(ex.id, ex);
    return map;
  }, [level]);

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    const isUnlocked = preview || allEnglishDaysComplete(level);
    setUnlocked(isUnlocked);

    if (isUnlocked) {
      const existing = loadEnglishFinalExamState(level);
      if (existing) {
        setState(existing);
      } else {
        const seed = createSeed();
        const selectedExerciseIds = pickEnglishExamExerciseIds({ level, seed, pickerVersion: 1 });
        const initial = createInitialEnglishFinalExamState({ selectedExerciseIds });
        saveEnglishFinalExamState(initial, level);
        setState(initial);
      }
    }
    setIsHydrated(true);
  }, [level]);

  const selectedExercises = useMemo((): Exercise[] => {
    if (!state) return [];
    return state.selectedExerciseIds
      .map((id) => exerciseById.get(id))
      .filter((ex): ex is Exercise => Boolean(ex));
  }, [state, exerciseById]);

  const { focusNextInput, setFocusRef } = useExerciseFocus(selectedExercises);

  const total = selectedExercises.length;
  const answeredCount = useMemo(() => {
    if (!state) return 0;
    return selectedExercises.filter((ex) => normalizeAnswerValue(state.answers[ex.id]) !== null).length;
  }, [state, selectedExercises]);
  const canFinish = total > 0 && answeredCount === total;
  const submitted = Boolean(state?.submittedAt);

  const persist = useCallback((next: EnglishFinalExamState) => {
    saveEnglishFinalExamState(next, level);
    setState(next);
  }, [level]);

  const onChangeValue = useCallback(
    (exerciseId: ExerciseId, value: string) => {
      const current = stateRef.current;
      if (!current || current.submittedAt) return;
      const nextCorrect = { ...current.correctMap };
      delete nextCorrect[exerciseId];
      persist({ ...current, answers: { ...current.answers, [exerciseId]: value }, correctMap: nextCorrect });
    },
    [persist],
  );

  const onFinish = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    const result = gradeEnglishFinalExam({ selectedExercises, answers: current.answers });
    if (!result.canFinish) return;
    persist({
      ...current,
      correctMap: result.correctMap,
      scorePercent: result.scorePercent,
      passed: result.passed,
      submittedAt: new Date().toISOString(),
    });
  }, [persist, selectedExercises]);

  const onRetry = useCallback(() => {
    clearEnglishFinalExamState(level);
    const seed = createSeed();
    const selectedExerciseIds = pickEnglishExamExerciseIds({ level, seed, pickerVersion: 1 });
    const initial = createInitialEnglishFinalExamState({ selectedExerciseIds });
    saveEnglishFinalExamState(initial, level);
    setState(initial);
  }, [level]);

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.english.exam.root()} className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים..." />
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main data-testid={testIds.screen.english.exam.root()}>
        <CenteredPanel
          data-testid={testIds.screen.english.exam.lockedNotice()}
          emoji="🔒"
          title="הַמִּבְחָן הַמְסַכֵּם נָעוּל"
          description="הַשְׁלִימוּ אֶת כָּל הַשִּׁעוּרִים בְּאַנְגְּלִית כְּדֵי לִפְתֹּחַ אֶת הַמִּבְחָן."
          actions={
            <ButtonLink href={routes.englishHome(level, { previewAll })} className="w-full text-center">
              חֲזָרָה לְאַנְגְּלִית
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (total < ENGLISH_FINAL_EXAM_MIN_COUNT) {
    return (
      <main data-testid={testIds.screen.english.exam.root()}>
        <CenteredPanel
          emoji="📚"
          title="עוֹד מְעַט!"
          description="צָרִיךְ עוֹד תְּרְגּוּלִים כְּדֵי לִבְנוֹת מִבְחָן מְסַכֵּם."
          actions={
            <ButtonLink href={routes.englishHome(level, { previewAll })} className="w-full text-center">
              חֲזָרָה לְאַנְגְּלִית
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const root = testIds.screen.english.exam.root();
  const stickyId = testIds.screen.english.exam.stickyHeader();
  const finishPanelId = testIds.screen.english.exam.finishPanel();

  return (
    <main data-testid={root}>
      <div data-testid={testIds.screen.english.exam.nav()} className="mb-3 flex items-center justify-between gap-3">
        <AppNavLink href={routes.englishHome(level, { previewAll })}>חֲזָרָה לְאַנְגְּלִית</AppNavLink>
      </div>

      <div
        data-testid={stickyId}
        className="progress-sticky rounded-3xl border border-[#efe9f7] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm"
      >
        <p data-testid={childTid(stickyId, "title")} className="mb-1 text-lg font-bold">
          📝 מִבְחָן מְסַכֵּם · {englishLevelLabel(level)}
        </p>
        <ProgressBar value={Math.round((answeredCount / total) * 100)} label={`עָנִיתָ עַל ${answeredCount}/${total}`} />
      </div>

      <div data-testid={childTid(root, "questions")} className="mb-6 mt-3 flex flex-col gap-1">
        {selectedExercises.map((exercise) => (
          <ExerciseItem
            screenRootTestId={root}
            key={exercise.id}
            exercise={exercise}
            value={state?.answers[exercise.id] ?? ""}
            isCorrect={submitted ? state?.correctMap[exercise.id] : undefined}
            wasChecked={submitted}
            isReadOnly={submitted}
            showCheckButton={false}
            setFocusRef={setFocusRef}
            wrongAttempts={0}
            hintUsed={false}
            onRevealHint={() => {}}
            onChangeValue={onChangeValue}
            onSubmitExercise={() => {}}
            onNextInput={focusNextInput}
            onRetryExercise={() => {}}
          />
        ))}
      </div>

      {submitted ? (
        <div
          data-testid={finishPanelId}
          className={`mb-6 rounded-3xl border p-6 text-center shadow-md ${
            state?.passed
              ? "border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] to-[#d1fae5]"
              : "border-[#fde9c8] bg-[#fffdf5]"
          }`}
        >
          <p data-testid={childTid(finishPanelId, "icon")} className="mb-1 text-5xl">
            {state?.passed ? "🎉" : "💪"}
          </p>
          <p data-testid={childTid(finishPanelId, "score")} className="mb-1 text-2xl font-bold text-[#2c2348]">
            {state?.scorePercent}%
          </p>
          <p data-testid={childTid(finishPanelId, "verdict")} className="mb-4 text-base font-semibold text-[#4f4860]">
            {state?.passed
              ? "כָּל הַכָּבוֹד! עָבַרְתָּ אֶת הַמִּבְחָן."
              : `צָרִיךְ ${ENGLISH_FINAL_EXAM_PASS_PERCENT}% כְּדֵי לַעֲבֹר — נַסּוּ שׁוּב!`}
          </p>
          <div data-testid={childTid(finishPanelId, "actions")} className="flex flex-col gap-2">
            <button
              data-testid={testIds.screen.english.exam.retryCta()}
              type="button"
              className="touch-button btn-accent w-full rounded-2xl py-3 font-semibold"
              onClick={onRetry}
            >
              מִבְחָן חָדָשׁ 🔄
            </button>
            <ButtonLink href={routes.englishHome(level, { previewAll })} className="w-full text-center">
              חֲזָרָה לְאַנְגְּלִית
            </ButtonLink>
          </div>
        </div>
      ) : (
        <button
          data-testid={testIds.screen.english.exam.finishCta()}
          type="button"
          disabled={!canFinish}
          className="touch-button btn-accent mb-6 w-full rounded-2xl py-4 text-lg font-semibold shadow-md disabled:opacity-50"
          onClick={onFinish}
        >
          {canFinish ? "סִיּוּם וּבְדִיקָה ✅" : `עָנִיתָ עַל ${answeredCount}/${total}`}
        </button>
      )}

      <StarReward visible={submitted && Boolean(state?.passed)} text="עָבַרְתָּ אֶת הַמִּבְחָן הַמְסַכֵּם!" onConfirm={() => {}} />
    </main>
  );
}
