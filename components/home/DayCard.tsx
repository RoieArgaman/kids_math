"use client";

import Link from "next/link";
import { logEvent } from "@/lib/analytics/events";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { FinalExamState } from "@/lib/final-exam/types";
import type { GradeId } from "@/lib/grades";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
import { formatMs } from "@/lib/utils/formatMs";
import type { DayId, DayProgressState, WorkbookDay } from "@/lib/types";

export type DayCardState = "locked" | "open" | "complete";

const STATE_COPY: Record<DayCardState, { icon: string; text: string }> = {
  locked: { icon: "🔒", text: "נָעוּל" },
  open: { icon: "▶️", text: "בֹּאוּ נִלְמַד!" },
  complete: { icon: "🏆", text: "הוּשְׁלַם" },
};

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🐬", "🦊", "🐼", "🦄", "🐙", "🦉", "🐳"];

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
  const dayEmoji = DAY_EMOJIS[(day.dayNumber - 1) % DAY_EMOJIS.length];
  const stateUi = STATE_COPY[state];

  const stateChipClasses =
    state === "locked"
      ? "bg-[#fee2e2] text-[#b91c1c]"
      : state === "complete"
        ? "bg-[#d1fae5] text-[#047857]"
        : "bg-[#ede9fe] text-[var(--accent-strong)]";

  const railColor =
    state === "open" ? "#a78bfa" : state === "complete" ? "#34d399" : undefined;
  const cardBorderClasses = railColor ? "border-s-rail" : "";

  const root = testIds.screen.home.dayCard(day.id);

  return (
    <article
      data-testid={root}
      style={railColor ? { borderInlineStartColor: railColor } : undefined}
      className={`surface relative overflow-hidden p-5 ${state === "complete" ? "surface-success" : ""} ${cardBorderClasses} ${state === "locked" ? "is-locked" : ""}`}
    >
      {/* Card header row */}
      <div
        data-testid={childTid(root, "headerRow")}
        className="mb-3 flex items-start justify-between gap-2 sm:gap-3"
      >
        <div
          data-testid={childTid(root, "titleWrap")}
          className="flex min-w-0 flex-1 items-start gap-2"
        >
          <span
            data-testid={childTid(root, "medallion")}
            aria-hidden="true"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] bg-[#f3effb] text-xl"
          >
            {dayEmoji}
          </span>
          <span
            data-testid={childTid(root, "dayNumBadge")}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700"
          >
            {day.dayNumber}
          </span>
          <strong
            data-testid={childTid(root, "title")}
            className="min-w-0 text-base font-bold leading-snug break-words text-[var(--title)]"
          >
            יוֹם {day.dayNumber}: {day.title}
          </strong>
        </div>

        <span
          data-testid={childTid(root, "stateChip")}
          aria-label={stateUi.text}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap sm:px-3 ${stateChipClasses}`}
        >
          {stateUi.icon} {stateUi.text}
        </span>
      </div>

      <p data-testid={childTid(root, "objective")} className="muted mb-3 text-sm">
        {day.objective}
      </p>

      {isFinalExamDay && !finalExamPassed ? (
        <p
          data-testid={childTid(root, "gmatHint")}
          className="mb-3 text-xs leading-relaxed text-slate-600"
        >
          ההתקדמות כאן מציגה את מבחן המסכם בלבד. אתגר GMAT (רשות, עם כללים בנפרד) ייפתח רק אחרי שעוברים את המבחן המסכם.
        </p>
      ) : null}

      {/* Progress bar */}
      <div data-testid={childTid(root, "progressRow")} className="mb-4">
        <div
          data-testid={childTid(root, "progressRowHeader")}
          className="mb-1 flex items-center justify-between text-xs font-medium"
        >
          <span data-testid={childTid(root, "progressLabel")} className="text-[var(--muted)]">
            הִתְקַדְּמוּת
          </span>
          <span
            data-testid={childTid(root, "progressPercent")}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${score === 100 ? "bg-[#d1fae5] text-emerald-600" : "bg-[#f3effb] text-[var(--accent-strong)]"}`}
          >
            {Math.round(score)}%
          </span>
        </div>
        <div
          data-testid={childTid(root, "progressTrack")}
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--track)]"
        >
          <div
            data-testid={childTid(root, "progressFill")}
            className={`h-full rounded-full transition-all ${score === 100 ? "bg-[#34d399]" : "bg-[var(--accent)]"}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {!isFinalExamDay && state !== "locked" && typeof dayProgress?.bestTimeMs === "number" ? (
        <p
          data-testid={testIds.screen.home.dayCardRecordTime(day.id)}
          className="muted mb-3 flex items-center justify-center gap-2 text-center text-xs"
          dir="rtl"
        >
          <span
            data-testid={childTid(testIds.screen.home.dayCardRecordTime(day.id), "label")}
            className="text-slate-500"
          >
            הזמן הכי טוב
          </span>
          <span
            data-testid={childTid(testIds.screen.home.dayCardRecordTime(day.id), "value")}
            dir="ltr"
            className="font-mono text-sm font-semibold tabular-nums text-slate-700"
          >
            {formatMs(dayProgress.bestTimeMs)}
          </span>
        </p>
      ) : null}

      {/* CTA */}
      {state === "locked" ? (
        <p data-testid={childTid(root, "lockedHint")} className="muted text-center text-sm">
          סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ 🔒
        </p>
      ) : state === "complete" ? (
        <Link
          data-testid={testIds.screen.home.dayCardCta(day.id)}
          className="touch-button block w-full rounded-full border border-emerald-300 bg-white text-center font-semibold text-emerald-700 sm:w-auto"
          href={routes.gradeDay(effectiveGrade, day.id as DayId, { previewAll })}
          onClick={() =>
            logEvent("day_card_clicked", {
              payload: { grade: effectiveGrade, dayId: day.id },
            })
          }
        >
          חֲזָרָה לַיּוֹם
        </Link>
      ) : (
        <Link
          data-testid={testIds.screen.home.dayCardCta(day.id)}
          className="touch-button btn-accent block w-full text-center sm:w-auto"
          href={routes.gradeDay(effectiveGrade, day.id as DayId, { previewAll })}
          onClick={() =>
            logEvent("day_card_clicked", {
              payload: { grade: effectiveGrade, dayId: day.id },
            })
          }
        >
          כְּנִיסָה לַיּוֹם
        </Link>
      )}
    </article>
  );
}
