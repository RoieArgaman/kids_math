interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div data-testid="km.autogen.progressbar.node.idx.0" className="surface p-4">
      <div data-testid="km.autogen.progressbar.node.idx.1" className="mb-3 flex items-center justify-between">
        <span data-testid="km.autogen.progressbar.node.idx.2" className="font-medium">{label ?? "הִתְקַדְּמוּת יוֹמִית"}</span>
        <span data-testid="km.autogen.progressbar.node.idx.3" className="rounded-full bg-purple-100 px-2 py-0.5 text-sm font-bold text-purple-700">
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
          className="h-5 overflow-hidden rounded-full bg-slate-100"
        >
          <div data-testid="km.autogen.progressbar.node.idx.6"
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${safeValue}%`,
              background: "linear-gradient(90deg, #FDE68A 0%, #6EE7B7 100%)",
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
