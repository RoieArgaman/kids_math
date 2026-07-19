import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type ChipTone = "neutral" | "success" | "warning" | "danger" | "info";

/** `lg` exists so call sites needing a bigger chip stop reaching for `!important`
 *  to out-specify the base padding (roadmap 3.5.4b). */
export type ChipSize = "default" | "lg";

export type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  className?: string;
  "data-testid"?: string;
  "aria-label"?: string;
};

function toneClassName(tone: ChipTone): string {
  if (tone === "danger") return "bg-[#fee2e2] text-[#dc2626]";
  if (tone === "warning") return "bg-[#fef3c7] text-[#92400e]";
  if (tone === "success") return "bg-[#d1fae5] text-[#047857]";
  if (tone === "info") return "bg-[#ede9fe] text-[var(--accent-strong)]";
  return "bg-[#f3effb] text-[#6b6577]";
}

const sizeClassName: Record<ChipSize, string> = {
  default: "px-2.5 py-1 text-xs",
  lg: "px-4 py-3 text-sm",
};

export function Chip({ children, tone = "neutral", size = "default", className, "data-testid": testId, ...rest }: ChipProps) {
  const merged = [
    "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap",
    sizeClassName[size],
    toneClassName(tone),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span data-testid={testId} className={merged} {...rest}>
      <span data-testid={testId ? childTid(testId, "text") : undefined}>{children}</span>
    </span>
  );
}

