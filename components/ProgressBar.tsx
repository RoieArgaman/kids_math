interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium">{label ?? "הִתְקַדְּמוּת יוֹמִית"}</span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-sm font-bold text-purple-700">
          {safeValue}%
        </span>
      </div>
      <div className="relative">
        <div
          aria-label={label ?? "הִתְקַדְּמוּת"}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={safeValue}
          role="progressbar"
          className="h-5 overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${safeValue}%`,
              background: "linear-gradient(90deg, #FDE68A 0%, #6EE7B7 100%)",
            }}
          />
        </div>
        {safeValue >= 50 && safeValue < 100 && (
          <span
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm leading-none"
            style={{ left: "calc(50% - 8px)" }}
            aria-hidden="true"
          >
            ⭐
          </span>
        )}
        {safeValue === 100 && (
          <span
            className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-sm leading-none"
            aria-hidden="true"
          >
            🏆
          </span>
        )}
      </div>
      {safeValue === 100 && (
        <p className="mt-2 text-center text-sm font-bold text-green-600">כָּל הַכָּבוֹד! 🎉</p>
      )}
    </div>
  );
}
