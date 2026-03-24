interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="surface p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label ?? "הִתְקַדְּמוּת יוֹמִית"}</span>
        <strong>{safeValue}%</strong>
      </div>
      <div
        aria-label={label ?? "הִתְקַדְּמוּת"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        role="progressbar"
        className="h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${safeValue}%`, backgroundColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}
