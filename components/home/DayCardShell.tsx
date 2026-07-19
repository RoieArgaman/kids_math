import Link from "next/link";
import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type DayCardState = "locked" | "open" | "complete";

const STATE_COPY: Record<DayCardState, { icon: string; text: string }> = {
  locked: { icon: "🔒", text: "נָעוּל" },
  open: { icon: "▶️", text: "בֹּאוּ נִלְמַד!" },
  complete: { icon: "🏆", text: "הוּשְׁלַם" },
};

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🐬", "🦊", "🐼", "🦄", "🐙", "🦉", "🐳"];

export function dayEmojiFor(dayNumber: number): string {
  return DAY_EMOJIS[(dayNumber - 1) % DAY_EMOJIS.length]!;
}

export type DayCardShellProps = {
  /** Each subject keeps its own testid namespace, so the shell takes ids rather
   *  than deriving them — that is what lets Math/English/Science share markup
   *  without any spec churn. */
  rootTestId: string;
  ctaTestId: string;
  dayNumber: number;
  title: string;
  objective?: string;
  state: DayCardState;
  /** 0–100. Every subject persists `percentDone` per day (WorkbookProgressState). */
  score: number;
  ctaHref: string;
  ctaLabel: string;
  onCtaClick?: () => void;
  lockedHint: string;
  /** Domain-specific extras rendered between the objective and the progress bar
   *  (Math uses it for the GMAT hint; nothing else needs it yet). */
  beforeProgress?: ReactNode;
  /** Domain-specific extras between the progress bar and the CTA (Math: best time). */
  afterProgress?: ReactNode;
};

/**
 * The one day-card design, shared by Math and the English/Science subject homes.
 *
 * Before this, the two were separate markup with different radii, borders and no
 * progress bar on the subject side — even though every subject already persisted
 * `percentDone` per day. This is presentational only: anything domain-specific
 * (final-exam scoring, best time, routing) stays in the calling screen.
 */
export function DayCardShell({
  rootTestId,
  ctaTestId,
  dayNumber,
  title,
  objective,
  state,
  score,
  ctaHref,
  ctaLabel,
  onCtaClick,
  lockedHint,
  beforeProgress,
  afterProgress,
}: DayCardShellProps) {
  const stateUi = STATE_COPY[state];
  const stateChipClasses =
    state === "locked"
      ? "bg-[#fee2e2] text-[#b91c1c]"
      : state === "complete"
        ? "bg-[#d1fae5] text-[#047857]"
        : "bg-[#ede9fe] text-[var(--accent-strong)]";

  const railColor =
    state === "open" ? "#a78bfa" : state === "complete" ? "#34d399" : undefined;

  return (
    <article
      data-testid={rootTestId}
      style={railColor ? { borderInlineStartColor: railColor } : undefined}
      className={`surface relative overflow-hidden p-5 ${state === "complete" ? "surface-success" : ""} ${railColor ? "border-s-rail" : ""} ${state === "locked" ? "is-locked" : ""}`}
    >
      <div
        data-testid={childTid(rootTestId, "headerRow")}
        className="mb-3 flex items-start justify-between gap-2 sm:gap-3"
      >
        <div
          data-testid={childTid(rootTestId, "titleWrap")}
          className="flex min-w-0 flex-1 items-start gap-2"
        >
          <span
            data-testid={childTid(rootTestId, "medallion")}
            aria-hidden="true"
            className="locked-dim flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] bg-[#f3effb] text-xl"
          >
            {dayEmojiFor(dayNumber)}
          </span>
          <span
            data-testid={childTid(rootTestId, "dayNumBadge")}
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700"
          >
            {dayNumber}
          </span>
          <strong
            data-testid={childTid(rootTestId, "title")}
            className="min-w-0 text-base font-bold leading-snug break-words text-[var(--title)]"
          >
            יוֹם {dayNumber}: {title}
          </strong>
        </div>

        <span
          data-testid={childTid(rootTestId, "stateChip")}
          aria-label={stateUi.text}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap sm:px-3 ${stateChipClasses}`}
        >
          {stateUi.icon} {stateUi.text}
        </span>
      </div>

      {objective ? (
        <p data-testid={childTid(rootTestId, "objective")} className="muted mb-3 text-sm">
          {objective}
        </p>
      ) : null}

      {beforeProgress}

      <div data-testid={childTid(rootTestId, "progressRow")} className="mb-4">
        <div
          data-testid={childTid(rootTestId, "progressRowHeader")}
          className="mb-1 flex items-center justify-between text-xs font-medium"
        >
          <span data-testid={childTid(rootTestId, "progressLabel")} className="text-[var(--muted)]">
            הִתְקַדְּמוּת
          </span>
          <span
            data-testid={childTid(rootTestId, "progressPercent")}
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${score === 100 ? "bg-[#d1fae5] text-emerald-600" : "bg-[#f3effb] text-[var(--accent-strong)]"}`}
          >
            {Math.round(score)}%
          </span>
        </div>
        <div
          data-testid={childTid(rootTestId, "progressTrack")}
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--track)]"
        >
          <div
            data-testid={childTid(rootTestId, "progressFill")}
            className={`h-full rounded-full transition-all ${score === 100 ? "bg-[#34d399]" : "bg-[var(--accent)]"}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {afterProgress}

      {state === "locked" ? (
        <p data-testid={childTid(rootTestId, "lockedHint")} className="muted text-center text-sm">
          {lockedHint}
        </p>
      ) : (
        <Link
          data-testid={ctaTestId}
          className={
            state === "complete"
              ? "touch-button block w-full rounded-full border border-emerald-300 bg-white text-center font-semibold text-emerald-700 sm:w-auto"
              : "touch-button btn-accent block w-full text-center sm:w-auto"
          }
          href={ctaHref}
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Link>
      )}
    </article>
  );
}
