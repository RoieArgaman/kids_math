"use client";

import { childTid } from "@/lib/testIds";

type TimedExamSectionHeaderProps = {
  rootTestId: string;
  sectionTitle: string;
  remainingSeconds: number;
};

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function TimedExamSectionHeader({
  rootTestId,
  sectionTitle,
  remainingSeconds,
}: TimedExamSectionHeaderProps) {
  const low = remainingSeconds > 0 && remainingSeconds <= 60;
  return (
    <header
      data-testid={rootTestId}
      className="progress-sticky rounded-3xl border border-slate-200 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm"
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
