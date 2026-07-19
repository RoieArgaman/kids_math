"use client";

import { childTid } from "@/lib/testIds";
import { formatClock } from "@/lib/utils/format";

type TimedExamSectionHeaderProps = {
  rootTestId: string;
  sectionTitle: string;
  remainingSeconds: number;
};

export function TimedExamSectionHeader({
  rootTestId,
  sectionTitle,
  remainingSeconds,
}: TimedExamSectionHeaderProps) {
  const low = remainingSeconds > 0 && remainingSeconds <= 60;
  return (
    <header
      data-testid={rootTestId}
      className="progress-sticky rounded-panel border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-xs"
    >
      <div data-testid={childTid(rootTestId, "bar")} className="flex flex-wrap items-center justify-between gap-2">
        <h1 data-testid={childTid(rootTestId, "title")} className="text-lg font-bold text-slate-900">
          {sectionTitle}
        </h1>
        <span
          data-testid={childTid(rootTestId, "timer")}
          className={`text-lg font-bold tabular-nums ${low ? "text-rose-700" : "text-slate-900"}`}
          aria-live="polite"
        >
          {formatClock(remainingSeconds)}
        </span>
      </div>
    </header>
  );
}
