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
      <div data-testid="km.autogen.progressbar.node.idx.0" className="flex items-center gap-3">
        <div data-testid="km.autogen.progressbar.node.idx.4" className="relative flex-1">
          <div data-testid="km.autogen.progressbar.node.idx.5"
            aria-label={label ?? "הִתְקַדְּמוּת"}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={safeValue}
            role="progressbar"
            className="h-2 overflow-hidden rounded-full bg-[--track]"
          >
            <div data-testid="km.autogen.progressbar.node.idx.6"
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
          data-testid="km.autogen.progressbar.node.idx.3"
          className={`inline-flex min-w-[3rem] justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
            isComplete ? "bg-[#e7f8f0] text-[#047857]" : "bg-[#f3effb] text-[--accent]"
          }`}
        >
          {safeValue}%
        </span>
      </div>
    );
  }

  return (
    <div data-testid="km.autogen.progressbar.node.idx.0" className="surface p-4">
      <div data-testid="km.autogen.progressbar.node.idx.1" className="mb-3 flex items-center justify-between">
        <span data-testid="km.autogen.progressbar.node.idx.2" className="font-medium text-[--muted]">{label ?? "הִתְקַדְּמוּת יוֹמִית"}</span>
        <span
          data-testid="km.autogen.progressbar.node.idx.3"
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isComplete ? "bg-[#e7f8f0] text-[#047857]" : "bg-[#f3effb] text-[--accent]"
          }`}
        >
          {safeValue}%
        </span>
      </div>
      <div data-testid="km.autogen.progressbar.node.idx.4" className="relative">
        <div data-testid="km.autogen.progressbar.node.idx.5"
          aria-label={label ?? "הִתְקַדְּמוּת"}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={safeValue}
          role="progressbar"
          className="h-2.5 overflow-hidden rounded-full bg-[--track]"
        >
          <div data-testid="km.autogen.progressbar.node.idx.6"
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
          <span data-testid="km.autogen.progressbar.node.idx.7"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm leading-none"
            style={{ left: "calc(50% - 8px)" }}
            aria-hidden="true"
          >
            ⭐
          </span>
        )}
        {safeValue === 100 && (
          <span data-testid="km.autogen.progressbar.node.idx.8"
            className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-sm leading-none"
            aria-hidden="true"
          >
            🏆
          </span>
        )}
      </div>
      {safeValue === 100 && (
        <p data-testid="km.autogen.progressbar.node.idx.9" className="mt-2 text-center text-sm font-bold text-green-600">כָּל הַכָּבוֹד! 🎉</p>
      )}
    </div>
  );
}
