import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type ChipTone = "neutral" | "success" | "warning" | "danger" | "info";

export type ChipProps = {
  children: ReactNode;
  tone?: ChipTone;
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

export function Chip({ children, tone = "neutral", className, "data-testid": testId, ...rest }: ChipProps) {
  const merged = [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
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

