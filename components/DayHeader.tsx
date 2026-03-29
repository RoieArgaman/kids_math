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

  return (
    <header
      data-testid={rootTestId ?? "km.autogen.dayheader.node.idx.0"}
      className="mb-4 rounded-3xl p-6"
      style={{ background: "linear-gradient(135deg, var(--accent) 0%, #818cf8 100%)" }}
    >
      <div data-testid={weekRowTestId} className="flex flex-wrap items-center gap-2">
        <span
          data-testid="km.autogen.dayheader.node.idx.1"
          className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs text-white"
        >
          שָׁבוּעַ {day.week}
        </span>
        {timerLabel ? (
          <span
            data-testid={sessionTimerTestId}
            dir="ltr"
            className="inline-block min-w-[3.25rem] rounded-full bg-white/20 px-3 py-1 text-xs font-semibold font-mono tabular-nums text-white"
            aria-live="polite"
          >
            ⏱ {timerLabel}
          </span>
        ) : null}
      </div>
      <h1 data-testid="km.autogen.dayheader.node.idx.2" className="mt-3 text-3xl font-extrabold text-white">
        <span data-testid="km.autogen.dayheader.node.idx.3" className="me-2" aria-hidden="true" style={{ unicodeBidi: "isolate" }}>
          {emoji}
        </span>
        יוֹם {day.dayNumber}: {day.title}
      </h1>
      <p data-testid="km.autogen.dayheader.node.idx.4" className="mt-2 text-sm text-indigo-200">
        {day.objective}
      </p>
    </header>
  );
}
