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
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { DEFAULT_MAX_REVIEW_DIVERGENCES, countReviewDivergences, wouldExceedReviewLimit } from "@/lib/exam-session";
import { gmatBreakDurationMs, gmatSectionDurationMs, SECTION_QUESTION_COUNTS } from "@/lib/gmat-challenge/config";
import { gradeGmatChallenge } from "@/lib/gmat-challenge/grading";
import { pickGmatChallengePool } from "@/lib/gmat-challenge/picker";
import {
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
import { isAnswerCorrect } from "@/lib/utils/exercise";
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

/** Picks the best unused exercise from a pool closest to the target difficulty. */
function selectNextFromPool(
  pool: ExerciseId[],
  usedIds: Set<ExerciseId>,
  targetDifficulty: number,
  exerciseById: Map<ExerciseId, Exercise>,
): ExerciseId | null {
  const available = pool.filter((id) => !usedIds.has(id));
  if (available.length === 0) return null;
  return available.reduce((best, id) => {
    const dBest = Math.abs((exerciseById.get(best)?.meta.difficulty ?? 3) - targetDifficulty);
    const dCur = Math.abs((exerciseById.get(id)?.meta.difficulty ?? 3) - targetDifficulty);
    return dCur < dBest ? id : best;
  });
}

function startSectionFromState(
  s: GmatChallengeStateV1,
  sectionKey: GmatSectionKey,
  orderIndex: number,
  exerciseById: Map<ExerciseId, Exercise>,
  shortT: boolean,
): GmatChallengeStateV1 {
  const pool = s.poolBySection?.[sectionKey] ?? [];
  const difficulty = s.adaptiveDifficulty ?? 3;
  const firstId = selectNextFromPool(pool, new Set(), difficulty, exerciseById);
  const newItems = firstId ? [firstId] : [];
  return {
    ...s,
    phase: "sectionActive",
    orderIndex,
    breakEndsAt: null,
    sectionEndsAt: Date.now() + gmatSectionDurationMs(sectionKey, shortT),
    itemsBySection: { ...s.itemsBySection, [sectionKey]: newItems },
    sectionQuestionIndex: 0,
    adaptiveDifficulty: 3,
  };
}

export function GmatChallengeScreen({ grade }: { grade: GradeId }) {
  const { previewAll, isRouteReady } = usePreviewAll();
  const stateRef = useRef<GmatChallengeStateV1 | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const rulesLoggedRef = useRef(false);
  const [state, setState] = useState<GmatChallengeStateV1 | null>(null);
  const [tick, setTick] = useState(0);
  const [gateAllowed, setGateAllowed] = useState<boolean | null>(null);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState<number | null>(null);

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
    if (existing && existing.phase !== "results") {
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

  // Reset review selection when leaving review phase
  useEffect(() => {
    if (state?.phase !== "sectionReview") {
      setReviewQuestionIndex(null);
    }
  }, [state?.phase]);

  const exerciseById = useMemo(() => {
    const map = new Map<ExerciseId, Exercise>();
    const days = getWorkbookDaysById(grade);
    for (const day of Object.values(days)) {
      for (const section of day.sections) {
        for (const ex of section.exercises) {
          map.set(ex.id, ex);
        }
      }
    }
    return map;
  }, [grade]);

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
      persist({
        ...s,
        phase: "sectionReview",
        sectionEndsAt: null,
        reviewSnapshot: snap,
      });
      return;
    }
    if (s.phase === "break" && s.breakEndsAt != null && now >= s.breakEndsAt) {
      const nextIndex = s.orderIndex + 1;
      const nextKey = s.sectionOrder[nextIndex];
      const shortT = shortTimersEnabled();
      persist(startSectionFromState(s, nextKey, nextIndex, exerciseById, shortT));
    }
  }, [exerciseById, persist]);

  useEffect(() => {
    reconcileTimers();
  }, [tick, reconcileTimers]);

  const currentKey = state ? state.sectionOrder[state.orderIndex] : null;

  const onRulesContinue = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "rules") return;
    if (!rulesLoggedRef.current) {
      logEvent("gmat_challenge_rules_viewed", { payload: { grade } });
      rulesLoggedRef.current = true;
    }
    const seed = createSeed();
    const pool = pickGmatChallengePool({ grade, seed, pickerVersion: 6 });
    // itemsBySection starts empty; questions are added adaptively as sections start
    const emptyItems = { quant: [], verbal: [], data: [] } as Record<GmatSectionKey, ExerciseId[]>;
    persist(createStateAfterPick({ grade, itemsBySection: emptyItems, poolBySection: pool, adaptiveDifficulty: 3 }));
  }, [grade, persist]);

  const onConfirmOrder = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "pickOrder") return;
    const shortT = shortTimersEnabled();
    const firstKey = s.sectionOrder[s.orderIndex];
    logEvent("gmat_challenge_started", { payload: { grade } });
    persist(startSectionFromState(s, firstKey, s.orderIndex, exerciseById, shortT));
  }, [exerciseById, grade, persist]);

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

  const onNextQuestion = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== "sectionActive" || !currentKey) return;
    const qIdx = s.sectionQuestionIndex ?? 0;
    const total = shortTimersEnabled() ? 1 : SECTION_QUESTION_COUNTS[currentKey];

    // Silently grade current question and update adaptive difficulty
    const currentExId = s.itemsBySection[currentKey][qIdx];
    const currentAnswer = currentExId ? (s.answers[currentExId] ?? "") : "";
    const currentEx = currentExId ? exerciseById.get(currentExId) : null;
    const correct = currentEx ? isAnswerCorrect(currentEx, currentAnswer) : false;
    const newDifficulty = Math.max(1, Math.min(5, (s.adaptiveDifficulty ?? 3) + (correct ? 1 : -1)));

    const goToReview = () => {
      const ids = s.itemsBySection[currentKey];
      const snap: Record<string, string> = {};
      for (const exId of ids) {
        snap[exId] = s.answers[exId] ?? "";
      }
      persist({
        ...s,
        adaptiveDifficulty: newDifficulty,
        phase: "sectionReview",
        sectionEndsAt: null,
        reviewSnapshot: snap,
      });
    };

    if (qIdx >= total - 1) {
      // Last question by configured total — go to review
      goToReview();
      return;
    }

    // Pick next question from pool adaptively
    const usedIds = new Set<ExerciseId>(s.itemsBySection[currentKey]);
    const pool = s.poolBySection?.[currentKey] ?? [];
    const nextId = selectNextFromPool(pool, usedIds, newDifficulty, exerciseById);

    if (!nextId) {
      // Pool exhausted early — treat current question as last and go to review
      goToReview();
      return;
    }

    const newItems = [...s.itemsBySection[currentKey], nextId];

    persist({
      ...s,
      itemsBySection: { ...s.itemsBySection, [currentKey]: newItems },
      sectionQuestionIndex: qIdx + 1,
      adaptiveDifficulty: newDifficulty,
    });
  }, [currentKey, exerciseById, persist]);

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
    persist(startSectionFromState(s, nextKey, nextIndex, exerciseById, shortT));
  }, [exerciseById, persist]);

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
    const initial = createInitialRulesState(grade);
    persist(initial);
    rulesLoggedRef.current = false;
  }, [grade, persist]);

  const setFocusRef = useCallback((exerciseId: ExerciseId, node: HTMLElement | null) => {
    refs.current[exerciseId] = node;
  }, []);

  const focusNextInput = useCallback(() => {
    // In sequential mode, focus is on single question — no-op
  }, []);

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

  let sectionRemainingSeconds = 0;
  if (state.phase === "sectionActive" && state.sectionEndsAt) {
    sectionRemainingSeconds = Math.max(0, Math.ceil((state.sectionEndsAt - Date.now()) / 1000));
  }

  let breakRemainingSeconds = 0;
  if (state.phase === "break" && state.breakEndsAt) {
    breakRemainingSeconds = Math.max(0, Math.ceil((state.breakEndsAt - Date.now()) / 1000));
  }

  // Use tick to drive timer re-renders
  void tick;

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

      {state.phase === "sectionActive" && currentKey ? (() => {
        const qIdx = state.sectionQuestionIndex ?? 0;
        const total = shortTimersEnabled() ? 1 : SECTION_QUESTION_COUNTS[currentKey];
        const exId = state.itemsBySection[currentKey][qIdx];
        const exercise = exId ? exerciseById.get(exId) : null;
        const value = exId ? (state.answers[exId] ?? "") : "";
        const isBookmarked = exId ? (state.bookmarks[currentKey]?.includes(exId) ?? false) : false;
        const bookmarkedNums = (state.bookmarks[currentKey] ?? [])
          .map((id) => state.itemsBySection[currentKey].indexOf(id) + 1)
          .filter((n) => n > 0)
          .sort((a, b) => a - b);
        const hasAnswer = value.trim().length > 0;

        return (
          <>
            <TimedExamSectionHeader
              rootTestId={testIds.screen.gmatChallenge.sectionHeader(grade)}
              sectionTitle={SECTION_LABELS[currentKey]}
              remainingSeconds={sectionRemainingSeconds}
            />
            <div data-testid={childTid(root, "questionHud")} className="surface mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-2 text-sm font-semibold">
              <span data-testid={childTid(root, "questionCounter")}>שאלה {qIdx + 1} מתוך {total}</span>
              {bookmarkedNums.length > 0 ? (
                <span data-testid={childTid(root, "bookmarkHint")} className="text-amber-700">
                  ⭐ מסומנות: {bookmarkedNums.join(", ")}
                </span>
              ) : null}
            </div>

            {exercise ? (
              <div data-testid={childTid(root, "activeQuestion")}>
                <ExerciseItem
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
                  showCheckButton={false}
                  disableRetry={true}
                  onRetryExercise={() => undefined}
                />
                <div data-testid={childTid(root, "activeQuestion", "actions")} className="mt-3 flex gap-2">
                  <button
                    type="button"
                    data-testid={childTid(root, "bookmark", "toggle", exId ?? "")}
                    className="touch-button rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    onClick={() => exId && toggleBookmark(exId)}
                  >
                    {isBookmarked ? "הסר סימון ⭐" : "סמן לבדיקה ☆"}
                  </button>
                  <button
                    type="button"
                    data-testid={qIdx >= total - 1
                      ? testIds.screen.gmatChallenge.finishSectionCta(grade)
                      : childTid(root, "nextQuestion")}
                    className={`touch-button flex-1 ${hasAnswer ? "btn-accent" : "opacity-60"}`}
                    onClick={onNextQuestion}
                  >
                    {qIdx >= total - 1 ? "סיום מקטע →" : "הבאה →"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                data-testid={childTid(root, "activeQuestion", "loading")}
                className="surface rounded-2xl p-4 text-center text-sm text-slate-500"
              >
                טוֹעֲנִים שְׁאֵלָה...
              </div>
            )}
          </>
        );
      })() : null}

      {state.phase === "sectionReview" && currentKey && state.reviewSnapshot ? (() => {
        const ids = state.itemsBySection[currentKey];
        const divergences = countReviewDivergences(state.answers, state.reviewSnapshot, ids);
        const atLimit = divergences >= DEFAULT_MAX_REVIEW_DIVERGENCES;

        return (
          <>
            <header data-testid={childTid(root, "reviewHeader")} className="progress-sticky mb-4 rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md">
              <h1 data-testid={childTid(root, "reviewTitle")} className="text-lg font-bold text-slate-900">
                סקירת מקטע — {SECTION_LABELS[currentKey]}
              </h1>
              <p data-testid={childTid(root, "review", "divergences")} className="muted mt-1 text-sm">
                שינויים: {divergences} מתוך {DEFAULT_MAX_REVIEW_DIVERGENCES} מותרים
              </p>
            </header>

            {reviewQuestionIndex !== null ? (
              // Show selected question for editing
              (() => {
                const exId = ids[reviewQuestionIndex];
                const exercise = exId ? exerciseById.get(exId) : null;
                const value = exId ? (state.answers[exId] ?? "") : "";
                const originalValue = exId ? (state.reviewSnapshot?.[exId] ?? "") : "";
                const wasChanged = value !== originalValue;
                const isLocked = atLimit && !wasChanged;
                return (
                  <div data-testid={childTid(root, "reviewQuestion", String(reviewQuestionIndex))}>
                    <button
                      type="button"
                      data-testid={childTid(root, "reviewBackToGrid")}
                      className="mb-3 touch-button rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      onClick={() => setReviewQuestionIndex(null)}
                    >
                      ← חזרה לרשימת השאלות
                    </button>
                    <p
                      data-testid={childTid(root, "reviewQuestionNumber", String(reviewQuestionIndex))}
                      className="mb-2 text-sm font-semibold text-slate-600"
                    >
                      שאלה {reviewQuestionIndex + 1}
                    </p>
                    {exercise ? (
                      <ExerciseItem
                        screenRootTestId={root}
                        exercise={exercise}
                        value={value}
                        wasChecked={false}
                        isCorrect={undefined}
                        isReadOnly={isLocked}
                        setFocusRef={setFocusRef}
                        wrongAttempts={0}
                        hintUsed={false}
                        onRevealHint={() => undefined}
                        onChangeValue={isLocked ? () => undefined : onChangeValue}
                        onSubmitExercise={() => undefined}
                        onNextInput={focusNextInput}
                        showCheckButton={false}
                        disableRetry={true}
                        onRetryExercise={() => undefined}
                      />
                    ) : null}
                    {isLocked ? (
                      <p data-testid={childTid(root, "reviewLockMessage")} className="mt-2 text-sm text-rose-600">
                        הגעתם למגבלת {DEFAULT_MAX_REVIEW_DIVERGENCES} שינויים.
                      </p>
                    ) : null}
                  </div>
                );
              })()
            ) : (
              // Show question grid
              <div data-testid={childTid(root, "reviewGrid")} className="surface rounded-3xl p-4">
                <p data-testid={childTid(root, "reviewInstructions")} className="mb-3 text-sm text-slate-600">
                  לחצו על שאלה כדי לעיין בה או לשנות את תשובתכם.
                </p>
                <div data-testid={childTid(root, "reviewGrid", "tiles")} className="grid grid-cols-4 gap-2">
                  {ids.map((exId, i) => {
                    const answered = Boolean(state.answers[exId]?.trim());
                    const bookmarked = state.bookmarks[currentKey]?.includes(exId);
                    const changed = state.answers[exId] !== state.reviewSnapshot?.[exId];
                    return (
                      <button
                        key={exId}
                        type="button"
                        data-testid={childTid(root, "reviewTile", exId)}
                        onClick={() => setReviewQuestionIndex(i)}
                        className={`touch-button rounded-xl border-2 py-3 text-sm font-bold ${
                          changed
                            ? "border-blue-400 bg-blue-50 text-blue-800"
                            : answered
                              ? "border-green-300 bg-green-50 text-green-800"
                              : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {i + 1}
                        {bookmarked ? " ⭐" : ""}
                      </button>
                    );
                  })}
                </div>
                <p data-testid={childTid(root, "reviewLegend")} className="mt-3 text-xs text-slate-500">
                  ירוק = נענה · כחול = שונה · ⭐ = מסומן
                </p>
              </div>
            )}

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
        );
      })() : null}

      {state.phase === "results" ? (
        <div data-testid={testIds.screen.gmatChallenge.results(grade)} className="surface rounded-3xl p-6">
          <h2 data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "title")} className="text-xl font-bold text-slate-900">סיימתם את האתגר</h2>
          <p data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "score")} className="mt-2 text-2xl font-bold">
            ציון כולל: {state.scorePercent ?? 0}%
          </p>
          <ul data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection")} className="muted mt-3 list-disc space-y-1 pr-5 text-sm">
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "quant")}>חשיבה כמותית: {state.correctBySection?.quant ?? 0} / {SECTION_QUESTION_COUNTS.quant} נכון</li>
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "verbal")}>חשיבה מילולית: {state.correctBySection?.verbal ?? 0} / {SECTION_QUESTION_COUNTS.verbal} נכון</li>
            <li data-testid={childTid(testIds.screen.gmatChallenge.results(grade), "bySection", "data")}>פיענוח נתונים: {state.correctBySection?.data ?? 0} / {SECTION_QUESTION_COUNTS.data} נכון</li>
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
