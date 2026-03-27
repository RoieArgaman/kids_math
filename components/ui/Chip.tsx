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
  if (tone === "danger") return "bg-red-100 text-red-600";
  if (tone === "warning") return "bg-amber-100 text-amber-800";
  if (tone === "success") return "bg-emerald-100 text-emerald-700";
  if (tone === "info") return "bg-violet-100 text-violet-800";
  return "bg-slate-100 text-slate-700";
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

