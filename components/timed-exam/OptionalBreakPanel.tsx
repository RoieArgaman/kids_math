"use client";

import { Surface } from "@/components/ui/Surface";
import { childTid } from "@/lib/testIds";

type OptionalBreakPanelProps = {
  rootTestId: string;
  remainingSeconds: number;
  onSkip: () => void;
};

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function OptionalBreakPanel({ rootTestId, remainingSeconds, onSkip }: OptionalBreakPanelProps) {
  return (
    <Surface data-testid={rootTestId} variant="default" className="rounded-3xl p-6 shadow-sm">
      <h2 data-testid={childTid(rootTestId, "title")} className="text-lg font-bold text-slate-900">
        הפסקה (רשות)
      </h2>
      <p data-testid={childTid(rootTestId, "timer")} className="mt-4 text-3xl font-bold tabular-nums text-slate-900" aria-live="polite">
        {formatClock(remainingSeconds)}
      </p>
      <p data-testid={childTid(rootTestId, "hint")} className="muted mt-2 text-sm">אפשר לדלג ולהמשיך מיד למקטע הבא.</p>
      <button
        type="button"
        data-testid={childTid(rootTestId, "cta", "skip")}
        className="touch-button btn-accent mt-6 w-full"
        onClick={onSkip}
      >
        דילוג והמשך
      </button>
    </Surface>
  );
}
