import type { WorkbookDay } from "@/lib/types";
import { childTid } from "@/lib/testIds";
import { formatMs } from "@/lib/utils/formatMs";

interface DayHeaderProps {
  day: WorkbookDay;
  rootTestId?: string;
  sessionTimerMs?: number | null;
  showSessionTimer?: boolean;
  sessionTimerTestId?: string;
}

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🌈", "🚀", "🎯", "🎨", "🎵", "🌟", "⭐", "🏆", "🎪", "🎭", "🎲"];

export function DayHeader({
  day,
  rootTestId,
  sessionTimerMs,
  showSessionTimer,
  sessionTimerTestId,
}: DayHeaderProps) {
  const emoji = DAY_EMOJIS[(day.dayNumber - 1) % DAY_EMOJIS.length];
  const timerLabel =
    showSessionTimer && sessionTimerMs != null && Number.isFinite(sessionTimerMs)
      ? formatMs(sessionTimerMs)
      : null;
  const weekRowTestId = rootTestId ? childTid(rootTestId, "weekRow") : "km.autogen.dayheader.node.idx.weekRow";
  const weekBadgeTestId = rootTestId ? childTid(rootTestId, "weekBadge") : "km.autogen.dayheader.node.idx.1";
  const titleTestId = rootTestId ? childTid(rootTestId, "title") : "km.autogen.dayheader.node.idx.2";
  const emojiTestId = rootTestId ? childTid(rootTestId, "emoji") : "km.autogen.dayheader.node.idx.3";
  const objectiveTestId = rootTestId ? childTid(rootTestId, "objective") : "km.autogen.dayheader.node.idx.4";
  const medallionTestId = rootTestId ? childTid(rootTestId, "medallion") : "km.autogen.dayheader.node.idx.5";
  const titleRowTestId = rootTestId ? childTid(rootTestId, "titleRow") : "km.autogen.dayheader.node.idx.6";

  return (
    <header
      data-testid={rootTestId ?? "km.autogen.dayheader.node.idx.0"}
      className="mb-4 rounded-3xl border border-[#e7defb] bg-[linear-gradient(135deg,#e9e2fb_0%,#f3ecfa_55%,#fbf4ee_100%)] p-6"
    >
      <div data-testid={weekRowTestId} className="flex flex-wrap items-center gap-2">
        <span
          data-testid={weekBadgeTestId}
          className="inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[--accent]"
        >
          שָׁבוּעַ {day.week}
        </span>
        {timerLabel ? (
          <span
            data-testid={sessionTimerTestId}
            dir="ltr"
            className="inline-block min-w-[3.25rem] rounded-full bg-white/70 px-3 py-1 text-xs font-semibold font-mono tabular-nums text-[--accent]"
            aria-live="polite"
          >
            ⏱ {timerLabel}
          </span>
        ) : null}
      </div>
      <div data-testid={titleRowTestId} className="mt-3 flex items-center gap-3">
        <span
          data-testid={medallionTestId}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm"
        >
          <span data-testid={emojiTestId} aria-hidden="true" style={{ unicodeBidi: "isolate" }}>
            {emoji}
          </span>
        </span>
        <h1 data-testid={titleTestId} className="text-3xl font-bold text-[--title]">
          יוֹם {day.dayNumber}: {day.title}
        </h1>
      </div>
      <p data-testid={objectiveTestId} className="mt-2 text-sm text-[--muted]">
        {day.objective}
      </p>
    </header>
  );
}
