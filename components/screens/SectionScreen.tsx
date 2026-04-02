"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionBlock } from "@/components/SectionBlock";
import { StarReward } from "@/components/StarReward";
import { getWorkbookDays } from "@/lib/content/workbook";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { COMPLETION_GATE_PERCENT, MAX_DAILY_WRONG_ANSWERS } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayAnswers } from "@/lib/hooks/useDayAnswers";
import { useDayReset } from "@/lib/hooks/useDayReset";
import { useExerciseFocus } from "@/lib/hooks/useExerciseFocus";
import { useDayUnlockStatus } from "@/lib/hooks/useDayUnlockStatus";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, ExerciseId, SectionId } from "@/lib/types";

export function SectionScreen({
  grade,
  dayId,
  sectionId,
}: {
  grade: GradeId;
  dayId: DayId;
  sectionId: SectionId;
}) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  const router = useRouter();
  const [showReward, setShowReward] = useState(false);

  const {
    setAnswer,
    resetDay,
    percentDone,
    wrongCount,
    correctAnswers,
  } = useProgress(dayId, { grade: effectiveGrade });

  const day = useMemo(
    () => getWorkbookDays(effectiveGrade).find((d) => d.id === dayId),
    [dayId, effectiveGrade],
  );

  const section = useMemo(
    () => day?.sections.find((s) => s.id === sectionId),
    [day, sectionId],
  );

  const sectionIdx = useMemo(
    () => day?.sections.findIndex((s) => s.id === sectionId) ?? -1,
    [day, sectionId],
  );

  const { previewAll, isRouteReady, isLocked: isDayLocked } = useDayUnlockStatus({
    grade: effectiveGrade,
    dayId,
  });

  // allExercisesCount must be the FULL day total for accurate percentDone
  const allExercises = useMemo(
    () => (day ? day.sections.flatMap((s) => s.exercises) : []),
    [day],
  );

  const { answers, correctMap, feedback, attempts, wrongAttempts, hintUsed, resetAnswerState, onChangeValue, onRetryExercise, onRevealHint, submitExercise } =
    useDayAnswers({
      day,
      grade: effectiveGrade,
      allExercisesCount: allExercises.length,
      setAnswer,
    });

  const handleReset = useCallback(() => {
    resetAnswerState();
  }, [resetAnswerState]);

  const { resetNotice } = useDayReset({ wrongCount, resetDay, onReset: handleReset });

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
      <main data-testid={testIds.screen.section.root(effectiveGrade, dayId, `${sectionId}.not-found`)}>
        <CenteredPanel
          emoji="🔍"
          title="הַחֵלֶק לֹא נִמְצָא."
          actions={
            <ButtonLink
              href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
              className="w-full text-center"
            >
              חֲזָרָה לַיּוֹם
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (!isRouteReady || isDayLocked === null) {
    return (
      <main
        data-testid={testIds.screen.section.root(effectiveGrade, dayId, `${sectionId}.loading`)}
        className="flex min-h-screen items-center justify-center"
      >
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים..." />
      </main>
    );
  }

  if (isDayLocked) {
    return (
      <main data-testid={testIds.screen.section.root(effectiveGrade, dayId, `${sectionId}.locked`)}>
        <CenteredPanel
          emoji="🔒"
          title="הַיּוֹם נָעוּל"
          actions={
            <ButtonLink
              href={routes.gradeHome(effectiveGrade, { previewAll })}
              className="w-full text-center"
            >
              חֲזוֹר הַבַּיְתָה
            </ButtonLink>
          }
        />
      </main>
    );
  }

  // Section gate checks
  if (sectionIdx > 0) {
    const isLastSection = sectionIdx === day.sections.length - 1;

    if (isLastSection) {
      // Last section: all other sections must be complete
      const allOthersComplete = day.sections
        .slice(0, -1)
        .every((s) => s.exercises.every((ex) => correctAnswers[ex.id as ExerciseId] === true));
      if (!allOthersComplete) {
        return (
          <main
            data-testid={testIds.screen.section.root(effectiveGrade, dayId, `${sectionId}.all-locked`)}
          >
            <CenteredPanel
              emoji="🔒"
              title="יֵשׁ לְהַשְׁלִים אֶת כָּל הַחֲלָקִים תְּחִילָה"
              description="הַשְׁלֵם אֶת כָּל הַחֲלָקִים הַקּוֹדְמִים כְּדֵי לִפְתֹּחַ אֶת הַחֵלֶק הָאַחֲרוֹן."
              actions={
                <ButtonLink
                  href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
                  className="w-full text-center"
                >
                  חֲזָרָה לַיּוֹם
                </ButtonLink>
              }
            />
          </main>
        );
      }
    } else {
      // Middle sections: warmup must be complete
      const warmupSection = day.sections[0];
      const warmupComplete =
        warmupSection?.exercises.every((ex) => correctAnswers[ex.id as ExerciseId] === true) ?? false;
      if (!warmupComplete) {
        return (
          <main
            data-testid={testIds.screen.section.root(effectiveGrade, dayId, `${sectionId}.warmup-locked`)}
          >
            <CenteredPanel
              emoji="🔒"
              title="צָרִיךְ לְהַשְׁלִים חִימּוּם תְּחִילָה"
              description="הַשְׁלֵם אֶת שְׁלַב הַחִימּוּם כְּדֵי לִפְתֹּחַ חֵלֶק זֶה."
              actions={
                <ButtonLink
                  href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
                  className="w-full text-center"
                >
                  חֲזָרָה לַיּוֹם
                </ButtonLink>
              }
            />
          </main>
        );
      }
    }
  }

  const stickyHeaderId = testIds.screen.section.stickyHeader(effectiveGrade, dayId, sectionId);
  const completionPanelId = testIds.screen.section.completionPanel(effectiveGrade, dayId, sectionId);
  const sectionRootId = testIds.screen.section.root(effectiveGrade, dayId, sectionId);

  return (
    <main data-testid={sectionRootId}>
      {/* Nav */}
      <div
        data-testid={testIds.screen.section.nav(effectiveGrade, dayId, sectionId)}
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
      >
        <AppNavLink href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}>
          חֲזָרָה לַיּוֹם
        </AppNavLink>
        <AppNavLink href={routes.gradeHome(effectiveGrade, { previewAll })}>
          חֲזָרָה לַחוֹבֶרֶת
        </AppNavLink>
      </div>

      {/* Sticky progress header */}
      <div
        data-testid={stickyHeaderId}
        className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm"
      >
        <p
          data-testid={childTid(stickyHeaderId, "label")}
          className="mb-1 text-xs font-semibold text-gray-600"
        >
          📊 הַהִתְקַדְּמוּת שֶׁלִּי:
        </p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${COMPLETION_GATE_PERCENT}%`} />
        <div data-testid={childTid(stickyHeaderId, "row")} className="mt-2 flex items-center gap-2">
          <div
            data-testid={childTid(stickyHeaderId, "wrongBadge")}
            className="error-counter-badge items-center gap-1 px-4 py-1.5 text-sm font-semibold"
            aria-live="polite"
          >
            💥 {wrongCount}/{MAX_DAILY_WRONG_ANSWERS}
          </div>
        </div>
      </div>

      {/* Reset notice */}
      {resetNotice ? (
        <div
          data-testid={childTid(sectionRootId, "resetNotice")}
          className="mb-5 mt-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-sm"
        >
          ⚠️ {resetNotice}
        </div>
      ) : null}

      {/* Section exercises */}
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

      {/* Section complete panel — shown when revisiting a completed section */}
      {sectionComplete && !showReward && (
        <div
          data-testid={completionPanelId}
          className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 to-green-200 p-6 text-center shadow-md"
        >
          <p data-testid={childTid(completionPanelId, "icon")} className="mb-1 text-4xl">
            ✅
          </p>
          <p
            data-testid={childTid(completionPanelId, "title")}
            className="mb-1 text-xl font-semibold text-emerald-900"
          >
            הַחֵלֶק הוּשְׁלַם!
          </p>
          <p
            data-testid={childTid(completionPanelId, "subtitle")}
            className="mb-4 text-sm font-semibold text-emerald-700"
          >
            כָּל הַיָּשָׁר — עָשִׂיתָ עֲבוֹדָה נֶהֱדֶרֶת!
          </p>
          <ButtonLink
            href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
            className="w-full text-center"
          >
            חֲזָרָה לַיּוֹם 🎉
          </ButtonLink>
        </div>
      )}

      <StarReward
        visible={showReward}
        text="הִשְׁלַמְתֶּם אֶת הַחֵלֶק בְּהַצְלָחָה."
        onConfirm={() => router.push(routes.gradeDay(effectiveGrade, dayId, { previewAll }))}
      />
    </main>
  );
}
