"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { StarReward } from "@/components/StarReward";
import { getEnglishDays } from "@/lib/content/english-workbook";
import { COMPLETION_GATE_PERCENT, MAX_SECTION_WRONG_ANSWERS } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayAnswers } from "@/lib/hooks/useDayAnswers";
import { useSectionReset } from "@/lib/hooks/useSectionReset";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, ExerciseId, SectionId } from "@/lib/types";

export function EnglishSectionScreen({ dayId, sectionId }: { dayId: DayId; sectionId: SectionId }) {
  const [showReward, setShowReward] = useState(false);

  const { setAnswer, percentDone, sectionWrongCount, correctAnswers, resetSection } = useProgress(
    dayId,
    { subject: "english", sectionId },
  );

  const day = useMemo(() => getEnglishDays().find((d) => d.id === dayId), [dayId]);
  const section = useMemo(() => day?.sections.find((s) => s.id === sectionId), [day, sectionId]);
  const sectionIdx = useMemo(
    () => day?.sections.findIndex((s) => s.id === sectionId) ?? -1,
    [day, sectionId],
  );

  const allExercises = useMemo(
    () => (day ? day.sections.flatMap((s) => s.exercises) : []),
    [day],
  );
  const sectionExerciseIds = useMemo(
    () => section?.exercises.map((ex) => ex.id as ExerciseId) ?? [],
    [section],
  );

  const {
    answers,
    correctMap,
    feedback,
    attempts,
    wrongAttempts,
    hintUsed,
    resetAnswerStateForExerciseIds,
    onChangeValue,
    onRetryExercise,
    onRevealHint,
    submitExercise,
  } = useDayAnswers({
    day,
    grade: "a",
    subject: "english",
    sectionId,
    allExercisesCount: allExercises.length,
    setAnswer,
  });

  const handleReset = useCallback(() => {
    resetAnswerStateForExerciseIds(sectionExerciseIds);
  }, [resetAnswerStateForExerciseIds, sectionExerciseIds]);

  const { resetNotice } = useSectionReset({
    sectionWrongCount,
    resetSection,
    sectionId,
    exerciseIds: sectionExerciseIds,
    totalExercises: allExercises.length,
    onReset: handleReset,
  });

  const { focusNextInput, setFocusRef } = useExerciseFocus(section?.exercises ?? []);

  const sectionComplete = useMemo(
    () => !!section && section.exercises.every((ex) => correctAnswers[ex.id as ExerciseId] === true),
    [section, correctAnswers],
  );

  const hasMounted = useRef(false);
  const prevSectionComplete = useRef(false);
  useEffect(() => {
    if (hasMounted.current && sectionComplete && !prevSectionComplete.current) {
      setShowReward(true);
    }
    prevSectionComplete.current = sectionComplete;
    hasMounted.current = true;
  }, [sectionComplete]);

  if (!day || !section) {
    return (
      <main data-testid={testIds.screen.english.section.root(dayId, `${sectionId}.not-found`)}>
        <CenteredPanel
          emoji="🔍"
          title="הַחֵלֶק לֹא נִמְצָא."
          actions={
            <ButtonLink href={routes.englishDay(dayId)} className="w-full text-center">
              חֲזָרָה לַשִּׁעוּר
            </ButtonLink>
          }
        />
      </main>
    );
  }

  // Section gating (mirrors the math contract): warmup always open; middle sections
  // need warmup complete; the last section needs all others complete.
  if (sectionIdx > 0) {
    const isLastSection = sectionIdx === day.sections.length - 1;
    const warmupComplete =
      day.sections[0]?.exercises.every((ex) => correctAnswers[ex.id as ExerciseId] === true) ?? false;
    const allOthersComplete = day.sections
      .slice(0, -1)
      .every((s) => s.exercises.every((ex) => correctAnswers[ex.id as ExerciseId] === true));
    const blocked = isLastSection ? !allOthersComplete : !warmupComplete;
    if (blocked) {
      return (
        <main data-testid={testIds.screen.english.section.root(dayId, `${sectionId}.locked`)}>
          <CenteredPanel
            emoji="🔒"
            title="צָרִיךְ לְהַשְׁלִים אֶת הַחֲלָקִים הַקּוֹדְמִים תְּחִילָה"
            actions={
              <ButtonLink href={routes.englishDay(dayId)} className="w-full text-center">
                חֲזָרָה לַשִּׁעוּר
              </ButtonLink>
            }
          />
        </main>
      );
    }
  }

  const stickyHeaderId = testIds.screen.english.section.stickyHeader(dayId, sectionId);
  const completionPanelId = testIds.screen.english.section.completionPanel(dayId, sectionId);
  const sectionRootId = testIds.screen.english.section.root(dayId, sectionId);

  return (
    <main data-testid={sectionRootId}>
      <div
        data-testid={testIds.screen.english.section.nav(dayId, sectionId)}
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
      >
        <AppNavLink href={routes.englishDay(dayId)}>חֲזָרָה לַשִּׁעוּר</AppNavLink>
        <AppNavLink href={routes.englishHome()}>חֲזָרָה לְאַנְגְּלִית</AppNavLink>
      </div>

      <div
        data-testid={stickyHeaderId}
        className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm"
      >
        <p data-testid={childTid(stickyHeaderId, "label")} className="mb-1 text-xs font-semibold text-gray-600">
          📊 הַהִתְקַדְּמוּת שֶׁלִּי:
        </p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${COMPLETION_GATE_PERCENT}%`} />
        <div data-testid={childTid(stickyHeaderId, "row")} className="mt-2 flex items-center gap-2">
          <div
            data-testid={childTid(stickyHeaderId, "wrongBadge")}
            className="error-counter-badge items-center gap-1 px-4 py-1.5 text-sm font-semibold"
            aria-live="polite"
          >
            💥 {sectionWrongCount}/{MAX_SECTION_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      {resetNotice ? (
        <div
          data-testid={childTid(sectionRootId, "resetNotice")}
          role="alert"
          className="mb-5 mt-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm"
        >
          ⚠️ {resetNotice}
        </div>
      ) : null}

      <div data-testid={childTid(sectionRootId, "sectionWrap")} className="mb-6 mt-3">
        <SectionBlock
          sectionId={section.id}
          title={section.title}
          learningGoal={section.learningGoal}
          type={section.type}
          example={section.example}
        >
          {section.exercises.map((exercise) => (
            <ExerciseItem
              screenRootTestId={sectionRootId}
              key={exercise.id}
              exercise={exercise}
              value={answers[exercise.id] ?? ""}
              retryMessage={feedback[exercise.id]}
              isCorrect={correctMap[exercise.id]}
              wasChecked={(attempts[exercise.id] ?? 0) > 0}
              setFocusRef={setFocusRef}
              wrongAttempts={wrongAttempts[exercise.id] ?? 0}
              hintUsed={hintUsed[exercise.id] ?? false}
              onRevealHint={onRevealHint}
              onChangeValue={onChangeValue}
              onSubmitExercise={submitExercise}
              onNextInput={focusNextInput}
              onRetryExercise={onRetryExercise}
            />
          ))}
        </SectionBlock>
      </div>

      {sectionComplete && !showReward && (
        <div
          data-testid={completionPanelId}
          className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 to-green-200 p-6 text-center shadow-md"
        >
          <p data-testid={childTid(completionPanelId, "icon")} className="mb-1 text-4xl">
            ✅
          </p>
          <p data-testid={childTid(completionPanelId, "title")} className="mb-1 text-xl font-semibold text-emerald-900">
            הַחֵלֶק הוּשְׁלַם!
          </p>
          <ButtonLink href={routes.englishDay(dayId)} className="w-full text-center">
            חֲזָרָה לַשִּׁעוּר 🎉
          </ButtonLink>
        </div>
      )}

      <StarReward
        visible={showReward}
        text="הִשְׁלַמְתֶּם אֶת הַחֵלֶק בְּהַצְלָחָה."
        onConfirm={() => setShowReward(false)}
      />
    </main>
  );
}
