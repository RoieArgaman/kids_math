"use client";

import { DayCardShell, type DayCardState } from "@/components/home/DayCardShell";
import { logEvent } from "@/lib/analytics/events";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GradeId } from "@/lib/grades";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
import { formatMs } from "@/lib/utils/formatMs";
import type { DayId, DayProgressState, WorkbookDay } from "@/lib/types";

export type { DayCardState };

function percentForFinalExamHomeCard(finalExam: FinalExamState | null): number {
  if (!finalExam) return 0;
  if (finalExam.submittedAt && typeof finalExam.scorePercent === "number") {
    return finalExam.scorePercent;
  }
  const ids = finalExam.selectedExerciseIds;
  if (!ids.length) return 0;
  const answered = ids.filter(
    (id) => normalizeAnswerValue(finalExam.answers[id] ?? "") !== null,
  ).length;
  return Math.round((answered / FINAL_EXAM_QUESTION_COUNT) * 100);
}

interface DayCardProps {
  day: WorkbookDay;
  state: DayCardState;
  score: number;
  effectiveGrade: GradeId;
  previewAll: boolean;
  dayProgress: DayProgressState | undefined;
  isFinalExamDay: boolean;
  finalExam: FinalExamState | null;
}

/**
 * Math workbook day card. Presentation lives in `DayCardShell` (shared with the
 * English/Science subject homes); everything math-specific — final-exam scoring,
 * the GMAT hint, best time and grade routing — stays here.
 */
export function DayCard({
  day,
  state,
  score: scoreProp,
  effectiveGrade,
  previewAll,
  dayProgress,
  isFinalExamDay,
  finalExam,
}: DayCardProps) {
  const finalExamPassed = Boolean(finalExam?.passed);
  const score = isFinalExamDay ? percentForFinalExamHomeCard(finalExam) : scoreProp;
  const root = testIds.screen.home.dayCard(day.id);
  const recordTimeTid = testIds.screen.home.dayCardRecordTime(day.id);

  return (
    <DayCardShell
      rootTestId={root}
      ctaTestId={testIds.screen.home.dayCardCta(day.id)}
      dayNumber={day.dayNumber}
      title={day.title}
      objective={day.objective}
      state={state}
      score={score}
      ctaHref={routes.gradeDay(effectiveGrade, day.id as DayId, { previewAll })}
      ctaLabel={state === "complete" ? "חֲזָרָה לַיּוֹם" : "כְּנִיסָה לַיּוֹם"}
      onCtaClick={() =>
        logEvent("day_card_clicked", {
          payload: { grade: effectiveGrade, dayId: day.id },
        })
      }
      lockedHint="סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ 🔒"
      beforeProgress={
        isFinalExamDay && !finalExamPassed ? (
          <p
            data-testid={childTid(root, "gmatHint")}
            className="mb-3 text-xs leading-relaxed text-[var(--muted)]"
          >
            ההתקדמות כאן מציגה את מבחן המסכם בלבד. אתגר GMAT (רשות, עם כללים בנפרד) ייפתח רק אחרי שעוברים את המבחן המסכם.
          </p>
        ) : null
      }
      afterProgress={
        !isFinalExamDay && state !== "locked" && typeof dayProgress?.bestTimeMs === "number" ? (
          <p
            data-testid={recordTimeTid}
            className="muted mb-3 flex items-center justify-center gap-2 text-center text-xs"
            dir="rtl"
          >
            <span data-testid={childTid(recordTimeTid, "label")} className="text-[var(--muted)]">
              הזמן הכי טוב
            </span>
            <span
              data-testid={childTid(recordTimeTid, "value")}
              dir="ltr"
              className="font-mono text-sm font-semibold tabular-nums text-[var(--title)]"
            >
              {formatMs(dayProgress.bestTimeMs)}
            </span>
          </p>
        ) : null
      }
    />
  );
}
