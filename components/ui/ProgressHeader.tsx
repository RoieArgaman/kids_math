import { ProgressBar } from "@/components/ProgressBar";
import { childTid } from "@/lib/testIds";

interface ProgressHeaderProps {
  percentDone: number;
  label: string;
  wrongCount?: number;
  maxWrong?: number;
  /** Extra Tailwind classes for the outer wrapper (e.g. "progress-sticky" or "mb-4"). */
  className?: string;
  "data-testid": string;
}

export function ProgressHeader({
  percentDone,
  label,
  wrongCount,
  maxWrong,
  className = "mb-4",
  "data-testid": testId,
}: ProgressHeaderProps) {
  return (
    <div
      data-testid={testId}
      className={`rounded-3xl border border-[--border] bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm ${className}`}
    >
      <p
        data-testid={childTid(testId, "label")}
        className="mb-1 text-xs font-semibold text-[--muted]"
      >
        📊 הַהִתְקַדְּמוּת שֶׁלִּי:
      </p>
      <ProgressBar value={percentDone} label={label} />
      {wrongCount !== undefined && maxWrong !== undefined && (
        <div
          data-testid={childTid(testId, "row")}
          className="mt-2 flex items-center gap-2"
        >
          <div
            data-testid={childTid(testId, "wrongBadge")}
            className="error-counter-badge items-center gap-1 px-4 py-1.5 text-sm font-bold"
            aria-live="polite"
          >
            ❌ שְׁגִיאוֹת {wrongCount}/{maxWrong}
          </div>
        </div>
      )}
    </div>
  );
}
