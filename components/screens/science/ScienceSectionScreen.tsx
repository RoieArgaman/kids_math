"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { StarReward } from "@/components/StarReward";
import { getAllScienceDays, type ScienceLevel } from "@/lib/content/science-workbook";
import { COMPLETION_GATE_PERCENT, MAX_SECTION_WRONG_ANSWERS } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayAnswers } from "@/lib/hooks/useDayAnswers";
import { useSectionReset } from "@/lib/hooks/useSectionReset";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, ExerciseId, SectionId } from "@/lib/types";

export function ScienceSectionScreen({
  level,
  dayId,
  sectionId,
}: {
  level: ScienceLevel;
  dayId: DayId;
  sectionId: SectionId;
}) {
  const [showReward, setShowReward] = useState(false);

  const { setAnswer, percentDone, sectionWrongCount, correctAnswers, resetSection } = useProgress(
    dayId,
    { subject: "science", sectionId },
  );

  const day = useMemo(() => getAllScienceDays().find((d) => d.id === dayId), [dayId]);
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
    subject: "science",
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
      <main data-testid={testIds.screen.science.section.root(dayId, `${sectionId}.not-found`)}>
        <CenteredPanel
          emoji="🔍"
          title="הַחֵלֶק לֹא נִמְצָא."
          actions={
            <ButtonLink href={routes.scienceDay(level, dayId)} className="w-full text-center">
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
        <main data-testid={testIds.screen.science.section.root(dayId, `${sectionId}.locked`)}>
          <CenteredPanel
            emoji="🔒"
            title="צָרִיךְ לְהַשְׁלִים אֶת הַחֲלָקִים הַקּוֹדְמִים תְּחִילָה"
            actions={
              <ButtonLink href={routes.scienceDay(level, dayId)} className="w-full text-center">
                חֲזָרָה לַשִּׁעוּר
              </ButtonLink>
            }
          />
        </main>
      );
    }
  }

  const stickyHeaderId = testIds.screen.science.section.stickyHeader(dayId, sectionId);
  const completionPanelId = testIds.screen.science.section.completionPanel(dayId, sectionId);
  const sectionRootId = testIds.screen.science.section.root(dayId, sectionId);

  return (
    <main data-testid={sectionRootId}>
      <div
        data-testid={testIds.screen.science.section.nav(dayId, sectionId)}
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
      >
        <AppNavLink href={routes.scienceDay(level, dayId)}>חֲזָרָה לַשִּׁעוּר</AppNavLink>
        <AppNavLink href={routes.scienceHome(level)}>חֲזָרָה לְמַדָּעִים</AppNavLink>
      </div>

      <div
        data-testid={stickyHeaderId}
        className="progress-sticky rounded-[18px] border border-[#efe9f7] bg-white/95 px-4 py-3 shadow-[0_2px_12px_rgba(80,60,140,0.05)] backdrop-blur-sm"
      >
        <p data-testid={childTid(stickyHeaderId, "label")} className="mb-1 text-xs font-semibold text-[#8a8298]">
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
          className="mb-5 mt-3 rounded-2xl border border-[#fecdd3] bg-[#fff5f6] p-4 text-sm font-semibold text-[#b91c1c] shadow-sm"
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
          className="mb-6 rounded-3xl border border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] to-[#d1fae5] p-6 text-center shadow-md"
        >
          <p data-testid={childTid(completionPanelId, "icon")} className="mb-1 text-4xl">
            ✅
          </p>
          <p data-testid={childTid(completionPanelId, "title")} className="mb-1 text-xl font-semibold text-[#047857]">
            הַחֵלֶק הוּשְׁלַם!
          </p>
          <ButtonLink href={routes.scienceDay(level, dayId)} className="w-full text-center">
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
