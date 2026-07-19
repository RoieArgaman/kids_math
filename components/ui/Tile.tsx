import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type TileTone = "default" | "neutral" | "success" | "warning";

export type TileProps = {
  label: string;
  /** The big value. Accept either `value` or `children` (children wins). */
  value?: ReactNode;
  children?: ReactNode;
  tone?: TileTone;
  "data-testid"?: string;
};

/**
 * Small labelled stat / counter tile used in the parent dashboard grids.
 *
 * - `tone="default"` reproduces the snapshot StatTile exactly:
 *   bordered white/70 surface, dark value, muted label.
 * - `tone="neutral" | "success" | "warning"` reproduce CounterTile:
 *   colored fill (text colour inherited from the fill), no border.
 */
function toneClassName(tone: TileTone): {
  container: string;
  value: string;
  label: string;
} {
  if (tone === "success") {
    return { container: "bg-[#d1fae5] text-[#047857]", value: "", label: "" };
  }
  if (tone === "warning") {
    return { container: "bg-[#fef3c7] text-[#92400e]", value: "", label: "" };
  }
  if (tone === "neutral") {
    return { container: "bg-[#f3effb] text-[#6b6577]", value: "", label: "" };
  }
  // default
  return {
    container: "border border-[#e7defb] bg-white/70",
    value: "text-[var(--title)]",
    label: "text-[var(--muted)]",
  };
}

export function Tile({ label, value, children, tone = "default", "data-testid": testId }: TileProps) {
  const tones = toneClassName(tone);
  // Class ordering is byte-matched to the original StatTile / CounterTile so
  // adoption is a true no-op (Tailwind order is cosmetic, but we keep it stable):
  //  - default tone: `rounded-2xl <border/bg> p-4 text-center`
  //  - colored tones: `rounded-2xl p-4 text-center <fill>`
  const containerClass =
    tone === "default"
      ? ["rounded-2xl", tones.container, "p-4 text-center"].filter(Boolean).join(" ")
      : ["rounded-2xl p-4 text-center", tones.container].filter(Boolean).join(" ");
  const valueClass = ["text-2xl font-bold", tones.value].filter(Boolean).join(" ");
  const labelClass = ["mt-1 text-xs font-medium", tones.label].filter(Boolean).join(" ");
  return (
    <div data-testid={testId} className={containerClass}>
      <div data-testid={testId ? childTid(testId, "value") : undefined} className={valueClass}>
        {children ?? value}
      </div>
      <div data-testid={testId ? childTid(testId, "label") : undefined} className={labelClass}>
        {label}
      </div>
    </div>
  );
}
