"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { StarReward } from "@/components/StarReward";
import type { GradeId } from "@/lib/grades";
import type { FinalExamState, SubjectScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { childTid } from "@/lib/testIds";
import type { Exercise, ExerciseId } from "@/lib/types";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

function createSeed(): string {
  const c = typeof window !== "undefined" ? window.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now()}-${Math.random()}`;
}

function allDaysComplete(config: SubjectScreenConfig, level: GradeId): boolean {
  const progress = config.loadProgressState();
  const days = config.getDays(level);
  return days.length > 0 && days.every((d) => progress.days[d.id]?.isComplete);
}

/**
 * SHARED final-exam screen for audio-first subjects (English / Science).
 * Subject-blind: all content, grading, storage, copy, routes, and testids come
 * from `config.exam` + the shared subject config. Grading thresholds and
 * storage keys live in each subject's own modules — never branched on here.
 */
export function SubjectFinalExamScreen({
  config,
  level,
}: {
  config: SubjectScreenConfig;
  level: GradeId;
}) {
  const exam = config.exam;
  const ids = exam.testIds;
  const backLabel = config.backToSubjectLabel;

  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [state, setState] = useState<FinalExamState | null>(null);
  const stateRef = useRef<FinalExamState | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const ex of exam.buildExamBank(level)) map.set(ex.id, ex);
    return map;
  }, [exam, level]);

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    const isUnlocked = preview || allDaysComplete(config, level);
    setUnlocked(isUnlocked);

    if (isUnlocked) {
      const existing = exam.loadState(level);
      if (existing) {
        setState(existing);
      } else {
        const seed = createSeed();
        const selectedExerciseIds = exam.pickExerciseIds({ level, seed, pickerVersion: 1 });
        const initial = exam.createInitialState({ selectedExerciseIds });
        exam.saveState(initial, level);
        setState(initial);
      }
    }
    setIsHydrated(true);
  }, [config, exam, level]);

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

  const persist = useCallback((next: FinalExamState) => {
    exam.saveState(next, level);
    setState(next);
  }, [exam, level]);

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
    const result = exam.grade({ selectedExercises, answers: current.answers });
    if (!result.canFinish) return;
    persist({
      ...current,
      correctMap: result.correctMap,
      scorePercent: result.scorePercent,
      passed: result.passed,
      submittedAt: new Date().toISOString(),
    });

    // Passing the level-A final exam (only reachable after all lessons) unlocks this
    // subject in Grade B.
    if (result.passed && level === "a") {
      void fetch("/api/grade-b-unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: config.subject }),
      }).catch(() => {
        /* best-effort; reconcileGradeUnlockCookies() heals a missed unlock later */
      });
    }
  }, [config.subject, exam, level, persist, selectedExercises]);

  const onRetry = useCallback(() => {
    exam.clearState(level);
    const seed = createSeed();
    const selectedExerciseIds = exam.pickExerciseIds({ level, seed, pickerVersion: 1 });
    const initial = exam.createInitialState({ selectedExerciseIds });
    exam.saveState(initial, level);
    setState(initial);
  }, [exam, level]);

  if (!isHydrated) {
    return (
      <main data-testid={ids.root()} className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים..." />
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main data-testid={ids.root()}>
        <CenteredPanel
          data-testid={ids.lockedNotice()}
          emoji="🔒"
          title="הַמִּבְחָן הַמְסַכֵּם נָעוּל"
          description={exam.lockedDescription}
          actions={
            <ButtonLink href={config.homeRoute(level, { previewAll })} className="w-full text-center">
              {backLabel}
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (total < exam.minCount) {
    return (
      <main data-testid={ids.root()}>
        <CenteredPanel
          emoji="📚"
          title="עוֹד מְעַט!"
          description="צָרִיךְ עוֹד תְּרְגּוּלִים כְּדֵי לִבְנוֹת מִבְחָן מְסַכֵּם."
          actions={
            <ButtonLink href={config.homeRoute(level, { previewAll })} className="w-full text-center">
              {backLabel}
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const root = ids.root();
  const stickyId = ids.stickyHeader();
  const finishPanelId = ids.finishPanel();

  return (
    <main data-testid={root}>
      <div data-testid={ids.nav()} className="mb-3 flex items-center justify-between gap-3">
        <AppNavLink href={config.homeRoute(level, { previewAll })}>{backLabel}</AppNavLink>
      </div>

      <div
        data-testid={stickyId}
        className="progress-sticky rounded-3xl border border-[#efe9f7] bg-white/95 px-4 py-3 shadow-md backdrop-blur-xs"
      >
        <p data-testid={childTid(stickyId, "title")} className="mb-1 text-lg font-bold">
          📝 מִבְחָן מְסַכֵּם · {exam.levelLabel(level)}
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
              : `צָרִיךְ ${exam.passPercent}% כְּדֵי לַעֲבֹר — נַסּוּ שׁוּב!`}
          </p>
          <div data-testid={childTid(finishPanelId, "actions")} className="flex flex-col gap-2">
            <button
              data-testid={ids.retryCta()}
              type="button"
              className="touch-button btn-accent w-full rounded-2xl py-3 font-semibold"
              onClick={onRetry}
            >
              מִבְחָן חָדָשׁ 🔄
            </button>
            <ButtonLink href={config.homeRoute(level, { previewAll })} className="w-full text-center">
              {backLabel}
            </ButtonLink>
          </div>
        </div>
      ) : (
        <button
          data-testid={ids.finishCta()}
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
