"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { OptionalBreakPanel } from "@/components/timed-exam/OptionalBreakPanel";
import { ExamRulesPanel } from "@/components/timed-exam/ExamRulesPanel";
import { SectionOrderPicker } from "@/components/timed-exam/SectionOrderPicker";
import { TimedExamSectionHeader } from "@/components/timed-exam/TimedExamSectionHeader";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { SectionBlock } from "@/components/SectionBlock";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { DEFAULT_MAX_REVIEW_DIVERGENCES, countReviewDivergences, wouldExceedReviewLimit } from "@/lib/exam-session";
import { gmatBreakDurationMs, gmatSectionDurationMs } from "@/lib/gmat-challenge/config";
import { gradeGmatChallenge } from "@/lib/gmat-challenge/grading";
import { pickGmatChallengeItems } from "@/lib/gmat-challenge/picker";
import {
  clearGmatChallengeState,
  createInitialRulesState,
  createStateAfterPick,
  loadGmatChallengeState,
  saveGmatChallengeState,
} from "@/lib/gmat-challenge/storage";
import type { GmatChallengeStateV1, GmatSectionKey } from "@/lib/gmat-challenge/types";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { gradeLabel, type GradeId } from "@/lib/grades";
import { logEvent } from "@/lib/analytics/events";
import type { Exercise, ExerciseId } from "@/lib/types";
import { routes } from "@/lib/routes";
import { usePreviewAll } from "@/lib/hooks/usePreviewAll";
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";
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

function shortTimersEnabled(): boolean {
  return typeof window !== "undefined" && Boolean(window.__KIDS_MATH_E2E_SHORT_GMAT__);
}

const SECTION_LABELS: Record<GmatSectionKey, string> = {
  quant: "חשיבה כמותית",
  verbal: "חשיבה מילולית (במתמטיקה)",
  data: "פיענוח נתונים",
};

export function GmatChallengeScreen({ grade }: { grade: GradeId }) {
  const { previewAll, isRouteReady } = usePreviewAll();
  const stateRef = useRef<GmatChallengeStateV1 | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const rulesLoggedRef = useRef(false);
  const [state, setState] = useState<GmatChallengeStateV1 | null>(null);
  const [tick, setTick] = useState(0);
  const [gateAllowed, setGateAllowed] = useState<boolean | null>(null);

  const persist = useCallback(
    (next: GmatChallengeStateV1) => {
      stateRef.current = next;
      saveGmatChallengeState(grade, next);
      setState(next);
    },
    [grade],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isRouteReady) return;
    const passed = Boolean(loadFinalExamState(grade)?.passed);
    setGateAllowed(previewAll || passed);
  }, [grade, isRouteReady, previewAll]);

  useEffect(() => {
    if (!isRouteReady || gateAllowed !== true) return;
    const existing = loadGmatChallengeState(grade);
    if (existing) {
      setState(existing);
      return;
    }
    const initial = createInitialRulesState(grade);
    saveGmatChallengeState(grade, initial);
    setState(initial);
  }, [grade, gateAllowed, isRouteReady]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const reconcileTimers = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const now = Date.now();
    if (s.phase === "sectionActive" && s.sectionEndsAt != null && now >= s.sectionEndsAt) {
      const key = s.sectionOrder[s.orderIndex];
      const ids = s.itemsBySection[key];
      const snap: Record<string, string> = {};
      for (const exId of ids) {
        snap[exId] = s.answers[exId] ?? "";
      }
      const nextCorrect = { ...s.correctMap };
      const nextAttempts = { ...s.attempts };
      for (const exId of ids) {
        delete nextCorrect[exId];
        delete nextAttempts[exId];
      }
      persist({
        ...s,
        phase: "sectionReview",
        sectionEndsAt: null,
        reviewSnapshot: snap,
        correctMap: nextCorrect,
        attempts: nextAttempts,
      });
      return;
    }
    if (s.phase === "break" && s.breakEndsAt != null && now >= s.breakEndsAt) {
      const nextIndex = s.orderIndex + 1;
      const nextKey = s.sectionOrder[nextIndex];
      const shortT = shortTimersEnabled();
      persist({
        ...s,
        phase: "sectionActive",
        orderIndex: nextIndex,
        breakEndsAt: null,
        reviewSnapshot: null,
        sectionEndsAt: now + gmatSectionDurationMs(nextKey, shortT),
      });
    }
  }, [persist]);

  useEffect(() => {
    reconcileTimers();
  }, [tick, reconcileTimers]);

  useEffect(() => {
    if (state?.phase === "rules" && !rulesLoggedRef.current) {
      rulesLoggedRef.current = true;
      logEvent("gmat_challenge_rules_viewed", { payload: { grade } });
    }
  }, [state?.phase, grade]);

  const exerciseById = useMemo(() => {
    const map = new Map<ExerciseId, Exercise>();
    for (const day of Object.values(getWorkbookDaysById(grade))) {
      for (const section of day.sections) {
        for (const ex of section.exercises) {
          map.set(ex.id, ex);
        }
      }
    }
    return map;
  }, [grade]);

  const onRulesContinue = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "rules") return;
    const seed = createSeed();
    const items = pickGmatChallengeItems({ grade, seed, pickerVersion: 1 });
    persist(createStateAfterPick({ grade, itemsBySection: items }));
  }, [grade, persist]);

  const onConfirmOrder = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "pickOrder") return;
    const shortT = shortTimersEnabled();
    const firstKey = s.sectionOrder[s.orderIndex];
    logEvent("gmat_challenge_started", { payload: { grade } });
    persist({
      ...s,
      phase: "sectionActive",
      sectionEndsAt: Date.now() + gmatSectionDurationMs(firstKey, shortT),
      reviewSnapshot: null,
    });
  }, [grade, persist]);

  const currentKey = state ? state.sectionOrder[state.orderIndex] : null;

  const selectedExercises = useMemo((): Exercise[] => {
    if (!state || !currentKey) return [];
    const ids = state.itemsBySection[currentKey];
    return ids.map((id) => exerciseById.get(id)).filter((ex): ex is Exercise => Boolean(ex));
  }, [state, currentKey, exerciseById]);

  const setFocusRef = useCallback((exerciseId: ExerciseId, node: HTMLElement | null) => {
    refs.current[exerciseId] = node;
  }, []);

  const focusNextInput = useCallback(
    (currentId: ExerciseId) => {
      const order = selectedExercises.map((e) => e.id);
      const idx = order.indexOf(currentId);
      const nextId = order[idx + 1];
      if (!nextId) return;
      refs.current[nextId]?.focus();
    },
    [selectedExercises],
  );

  const onChangeValue = useCallback(
    (exerciseId: ExerciseId, value: string) => {
      const s = stateRef.current;
      if (!s || !currentKey) return;
      if (s.phase === "sectionReview" && s.reviewSnapshot) {
        const ids = s.itemsBySection[currentKey];
        if (
          wouldExceedReviewLimit(
            s.answers,
            s.reviewSnapshot,
            ids,
            exerciseId,
            value,
            DEFAULT_MAX_REVIEW_DIVERGENCES,
          )
        ) {
          return;
        }
      }
      persist({
        ...s,
        answers: { ...s.answers, [exerciseId]: value },
      });
    },
    [currentKey, persist],
  );

  const onRetryExercise = useCallback(
    (exerciseId: ExerciseId) => {
      const s = stateRef.current;
      if (!s || s.phase !== "sectionActive") return;
      persist({
        ...s,
        answers: { ...s.answers, [exerciseId]: "" },
      });
    },
    [persist],
  );

  const submitExercise = useCallback(
    (exercise: Exercise) => {
      const s = stateRef.current;
      if (!s || s.phase !== "sectionActive") return;
      const userAnswer = s.answers[exercise.id] ?? "";
      const normalizedAnswer = normalizeAnswerValue(userAnswer);
      const previousAttempts = s.attempts[exercise.id] ?? 0;
      if (normalizedAnswer === null) {
        persist({
          ...s,
          correctMap: { ...s.correctMap, [exercise.id]: false },
        });
        return;
      }
      const success = isAnswerCorrect(exercise, userAnswer);
      persist({
        ...s,
        attempts: { ...s.attempts, [exercise.id]: previousAttempts + 1 },
        correctMap: { ...s.correctMap, [exercise.id]: success },
      });
    },
    [persist],
  );

  const goToReview = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "sectionActive" || !currentKey) return;
    const ids = s.itemsBySection[currentKey];
    const snap: Record<string, string> = {};
    for (const exId of ids) {
      snap[exId] = s.answers[exId] ?? "";
    }
    const nextCorrect = { ...s.correctMap };
    const nextAttempts = { ...s.attempts };
    for (const exId of ids) {
      delete nextCorrect[exId];
      delete nextAttempts[exId];
    }
    persist({
      ...s,
      phase: "sectionReview",
      sectionEndsAt: null,
      reviewSnapshot: snap,
      correctMap: nextCorrect,
      attempts: nextAttempts,
    });
  }, [currentKey, persist]);

  const onConfirmReview = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "sectionReview" || !currentKey || !s.reviewSnapshot) return;
    logEvent("gmat_challenge_section_completed", {
      payload: { grade, section: currentKey, orderIndex: s.orderIndex },
    });
    if (s.orderIndex >= 2) {
      const graded = gradeGmatChallenge({
        itemsBySection: s.itemsBySection,
        exerciseById,
        answers: s.answers,
      });
      persist({
        ...s,
        phase: "results",
        reviewSnapshot: null,
        sectionEndsAt: null,
        breakEndsAt: null,
        scorePercent: graded.scorePercent,
        scoreBySection: graded.scoreBySection,
        correctBySection: graded.correctBySection,
        totalQuestions: graded.totalQuestions,
      });
      logEvent("gmat_challenge_completed", {
        payload: { grade, scorePercent: graded.scorePercent },
      });
      return;
    }
    const shortT = shortTimersEnabled();
    persist({
      ...s,
      phase: "break",
      breakEndsAt: Date.now() + gmatBreakDurationMs(shortT),
      reviewSnapshot: null,
    });
  }, [currentKey, exerciseById, grade, persist]);

  const onSkipBreak = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "break") return;
    const nextIndex = s.orderIndex + 1;
    const nextKey = s.sectionOrder[nextIndex];
    const shortT = shortTimersEnabled();
    persist({
      ...s,
      phase: "sectionActive",
      orderIndex: nextIndex,
      breakEndsAt: null,
      sectionEndsAt: Date.now() + gmatSectionDurationMs(nextKey, shortT),
    });
  }, [persist]);

  const toggleBookmark = useCallback(
    (exerciseId: ExerciseId) => {
      const s = stateRef.current;
      if (!s || s.phase !== "sectionActive" || !currentKey) return;
      const list = s.bookmarks[currentKey] ?? [];
      const has = list.includes(exerciseId);
      const nextList = has ? list.filter((id) => id !== exerciseId) : [...list, exerciseId];
      persist({
        ...s,
        bookmarks: { ...s.bookmarks, [currentKey]: nextList },
      });
    },
    [currentKey, persist],
  );

  const restart = useCallback(() => {
    clearGmatChallengeState(grade);
    const initial = createInitialRulesState(grade);
    saveGmatChallengeState(grade, initial);
    setState(initial);
    rulesLoggedRef.current = false;
  }, [grade]);

  if (!isRouteReady || gateAllowed === null) {
    return (
      <main data-testid={testIds.screen.gmatChallenge.root(`${grade}.loading`)} className="flex min-h-screen items-center justify-center">
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים..." />
      </main>
    );
  }

  if (!gateAllowed) {
    return (
      <main data-testid={testIds.screen.gmatChallenge.locked(grade)}>
        <CenteredPanel
          emoji="🔒"
          title="האתגר נעול"
          description="מבחן מסכם שעברת בהצלחה נדרש כדי לפתוח את אתגר ההתנסות."
          actions={
            <Link
              data-testid={childTid(testIds.screen.gmatChallenge.locked(grade), "cta", "home")}
              href={routes.gradeHome(grade, { previewAll })}
              className="touch-button btn-accent inline-block w-full text-center"
            >
              חזרה לחוברת
            </Link>
          }
        />
      </main>
    );
  }

  if (!state) {
    return (
      <main data-testid={testIds.screen.gmatChallenge.root(`${grade}.boot`)}>
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים..." />
      </main>
    );
  }

  const root = testIds.screen.gmatChallenge.root(grade);
  const divergences =
    state.phase === "sectionReview" && state.reviewSnapshot && currentKey
      ? countReviewDivergences(state.answers, state.reviewSnapshot, state.itemsBySection[currentKey])
      : 0;

  let sectionRemainingSeconds = 0;
  if (state.phase === "sectionActive" && state.sectionEndsAt) {
    sectionRemainingSeconds = Math.max(0, Math.ceil((state.sectionEndsAt - Date.now()) / 1000));
  }

  let breakRemainingSeconds = 0;
  if (state.phase === "break" && state.breakEndsAt) {
    breakRemainingSeconds = Math.max(0, Math.ceil((state.breakEndsAt - Date.now()) / 1000));
  }

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "topNav")} className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <AppNavLink href={routes.gradeHome(grade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
      </div>

      {state.phase === "rules" ? (
        <ExamRulesPanel
          rootTestId={testIds.screen.gmatChallenge.rulesPanel(grade)}
          title={`אתגר התנסות (בהשראת GMAT Focus) — כיתה ${gradeLabel(grade)}`}
          backHref={routes.gradeHome(grade, { previewAll })}
          backTestId={childTid(testIds.screen.gmatChallenge.rulesPanel(grade), "cta", "back")}
          onContinue={onRulesContinue}
        />
      ) : null}

      {state.phase === "pickOrder" ? (
        <SectionOrderPicker
          rootTestId={testIds.screen.gmatChallenge.orderPanel(grade)}
          order={state.sectionOrder}
          labels={SECTION_LABELS}
          onChangeOrder={(next) => persist({ ...state, sectionOrder: next })}
          onConfirm={onConfirmOrder}
        />
      ) : null}

      {state.phase === "break" ? (
        <OptionalBreakPanel
          rootTestId={testIds.screen.gmatChallenge.breakPanel(grade)}
          remainingSeconds={breakRemainingSeconds}
          onSkip={onSkipBreak}
        />
      ) : null}

      {state.phase === "sectionActive" && currentKey ? (
        <>
          <TimedExamSectionHeader
            rootTestId={testIds.screen.gmatChallenge.sectionHeader(grade)}
            sectionTitle={SECTION_LABELS[currentKey]}
            remainingSeconds={sectionRemainingSeconds}
          />
          {state.bookmarks[currentKey]?.length ? (
            <p data-testid={childTid(root, "bookmarks", "hint")} className="muted mt-2 text-sm">
              סימונים לבדיקה: {state.bookmarks[currentKey].length}
            </p>
          ) : null}
          <SectionBlock
            sectionId={`gmat.${currentKey}.active`}
            data-testid={childTid(root, "section", currentKey, "active")}
            title="שאלות המקטע"
            type="review"
            learningGoal="עונים על השאלות לפני שקוראים לסיום המקטע."
          >
            {selectedExercises.map((exercise) => {
              const value = state.answers[exercise.id] ?? "";
              const attempts = state.attempts[exercise.id] ?? 0;
              const wasChecked = exercise.id in state.correctMap;
              const isCorrect = state.correctMap[exercise.id];
              const retryMessage = wasChecked ? getRetryFeedbackText(exercise, value, attempts) : undefined;
              const marked = state.bookmarks[currentKey]?.includes(exercise.id);
              return (
                <div key={exercise.id} data-testid={childTid(root, "exerciseRow", exercise.id)}>
                  <button
                    type="button"
                    data-testid={childTid(root, "bookmark", "toggle", exercise.id)}
                    className="mb-2 touch-button rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    onClick={() => toggleBookmark(exercise.id)}
                  >
                    {marked ? "הסר סימון לבדיקה" : "סמן לבדיקה"}
                  </button>
                  <ExerciseItem
                    screenRootTestId={root}
                    exercise={exercise}
                    value={value}
                    wasChecked={wasChecked}
                    isCorrect={isCorrect}
                    retryMessage={retryMessage}
                    isReadOnly={false}
                    setFocusRef={setFocusRef}
                    wrongAttempts={0}
                    hintUsed={false}
                    onRevealHint={() => undefined}
                    onChangeValue={onChangeValue}
                    onSubmitExercise={submitExercise}
                    onNextInput={focusNextInput}
                    onRetryExercise={onRetryExercise}
                  />
                </div>
              );
            })}
          </SectionBlock>
          <div data-testid={childTid(root, "finishSectionPanel")} className="surface mt-4 rounded-3xl p-5">
            <button
              type="button"
              data-testid={testIds.screen.gmatChallenge.finishSectionCta(grade)}
              className="touch-button btn-accent w-full"
              onClick={goToReview}
            >
              סיום מקטע ומעבר לסקירה
            </button>
          </div>
        </>
      ) : null}

      {state.phase === "sectionReview" && currentKey && state.reviewSnapshot ? (
        <>
          <header data-testid={childTid(root, "reviewHeader")} className="progress-sticky mb-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md">
            <h1 data-testid={childTid(root, "reviewTitle")} className="text-lg font-bold text-slate-900">סקירת מקטע — {SECTION_LABELS[currentKey]}</h1>
            <p data-testid={childTid(root, "review", "divergences")} className="muted mt-1 text-sm">
              שינויים מהמצב בסוף המקטע: {divergences} מתוך {DEFAULT_MAX_REVIEW_DIVERGENCES} מותרים
            </p>
          </header>
          <SectionBlock
            sectionId={`gmat.${currentKey}.review`}
            data-testid={childTid(root, "section", currentKey, "review")}
            title="בדקו והתאימו עד שלוש תשובות שונות מהמצב הקודם"
            type="review"
            learningGoal="רק שאלות שמשתנות נספרות כלפי מגבלת השלוש."
          >
            {selectedExercises.map((exercise) => {
              const value = state.answers[exercise.id] ?? "";
              return (
                <ExerciseItem
                  key={exercise.id}
                  screenRootTestId={root}
                  exercise={exercise}
                  value={value}
                  wasChecked={false}
                  isCorrect={undefined}
                  isReadOnly={false}
                  setFocusRef={setFocusRef}
                  wrongAttempts={0}
                  hintUsed={false}
                  onRevealHint={() => undefined}
                  onChangeValue={onChangeValue}
                  onSubmitExercise={() => undefined}
                  onNextInput={focusNextInput}
                  onRetryExercise={() => undefined}
                />
              );
            })}
          </SectionBlock>
          <div data-testid={childTid(root, "confirmReviewPanel")} className="surface mt-4 rounded-3xl p-5">
            <button
              type="button"
              data-testid={testIds.screen.gmatChallenge.confirmReviewCta(grade)}
              className="touch-button btn-accent w-full"
              onClick={onConfirmReview}
            >
              אישור סקירה והמשך
            </button>
          </div>
        </>
      ) : null}

      {state.phase === "results" ? (
        <div data-testid={testIds.screen.gmatChallenge.results(grade)} className="surface rounded-3xl p-6">
          <h2 data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "title")} className="text-xl font-bold text-slate-900">סיימתם את האתגר</h2>
          <p data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "score")} className="mt-2 text-2xl font-bold">
            ציון כולל: {state.scorePercent ?? 0}%
          </p>
          <ul data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection")} className="muted mt-3 list-disc space-y-1 pr-5 text-sm">
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "quant")}>חשיבה כמותית: {state.scoreBySection?.quant ?? 0}%</li>
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "verbal")}>חשיבה מילולית: {state.scoreBySection?.verbal ?? 0}%</li>
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "data")}>פיענוח נתונים: {state.scoreBySection?.data ?? 0}%</li>
          </ul>
          <p data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "footnote")} className="muted mt-3 text-xs">זכרו: זה תרגול רשות — הכי חשוב מה שלמדתם בכיתה.</p>
          <button
            type="button"
            data-testid={testIds.screen.gmatChallenge.restartCta(grade)}
            className="touch-button btn-accent mt-6 w-full"
            onClick={restart}
          >
            להתחיל מחדש
          </button>
        </div>
      ) : null}
    </main>
  );
}
