import { testIds } from "@/lib/testIds";

interface ProgressBarProps {
  value: number;
  label?: string;
  /** Compact: bare track + percent pill, no card/label/markers. Used inside ProgressHeader. */
  compact?: boolean;
}

export function ProgressBar({ value, label, compact = false }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  const isComplete = safeValue === 100;

  if (compact) {
    return (
      <div data-testid={testIds.component.progressBar.root()} className="flex items-center gap-3">
        <div data-testid={testIds.component.progressBar.trackWrap()} className="relative flex-1">
          <div data-testid={testIds.component.progressBar.track()}
            aria-label={label ?? "הִתְקַדְּמוּת"}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={safeValue}
            role="progressbar"
            className="h-2 overflow-hidden rounded-full bg-[var(--track)]"
          >
            <div data-testid={testIds.component.progressBar.fill()}
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${safeValue}%`,
                background: isComplete
                  ? "linear-gradient(90deg, #34d399 0%, #10b981 100%)"
                  : "linear-gradient(90deg, #8b75cc 0%, #a78bfa 100%)",
              }}
            />
          </div>
        </div>
        <span
          data-testid={testIds.component.progressBar.percent()}
          className={`inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
            isComplete ? "bg-[#e7f8f0] text-[#047857]" : "bg-[#f3effb] text-[var(--accent-strong)]"
          }`}
        >
          {safeValue}%
        </span>
      </div>
    );
  }

  return (
    <div data-testid={testIds.component.progressBar.root()} className="surface p-4">
      <div data-testid={testIds.component.progressBar.header()} className="mb-3 flex items-center justify-between">
        <span data-testid={testIds.component.progressBar.label()} className="font-medium text-[var(--muted)]">{label ?? "הִתְקַדְּמוּת יוֹמִית"}</span>
        <span
          data-testid={testIds.component.progressBar.percent()}
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isComplete ? "bg-[#e7f8f0] text-[#047857]" : "bg-[#f3effb] text-[var(--accent-strong)]"
          }`}
        >
          {safeValue}%
        </span>
      </div>
      <div data-testid={testIds.component.progressBar.trackWrap()} className="relative">
        <div data-testid={testIds.component.progressBar.track()}
          aria-label={label ?? "הִתְקַדְּמוּת"}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={safeValue}
          role="progressbar"
          className="h-2.5 overflow-hidden rounded-full bg-[var(--track)]"
        >
          <div data-testid={testIds.component.progressBar.fill()}
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${safeValue}%`,
              background: isComplete
                ? "linear-gradient(90deg, #34d399 0%, #10b981 100%)"
                : "linear-gradient(90deg, #8b75cc 0%, #a78bfa 100%)",
            }}
          />
        </div>
        {safeValue >= 50 && safeValue < 100 && (
          <span data-testid={testIds.component.progressBar.markerHalfway()}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm leading-none"
            style={{ left: "calc(50% - 8px)" }}
            aria-hidden="true"
          >
            ⭐
          </span>
        )}
        {safeValue === 100 && (
          <span data-testid={testIds.component.progressBar.markerComplete()}
            className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-sm leading-none"
            aria-hidden="true"
          >
            🏆
          </span>
        )}
      </div>
      {safeValue === 100 && (
        <p data-testid={testIds.component.progressBar.completeMessage()} className="mt-2 text-center text-sm font-bold text-green-600">כָּל הַכָּבוֹד! 🎉</p>
      )}
    </div>
  );
}
