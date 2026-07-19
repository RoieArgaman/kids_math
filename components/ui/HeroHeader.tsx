import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type HeroDecoration = {
  emoji: string;
  className: string;
};

/** `roomy` is the legal-page hero: more vertical air for long documents. It exists
 *  so those pages stop reaching for `!important` to out-specify the base padding. */
export type HeroHeaderSize = "default" | "roomy";

export type HeroHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  decorations?: HeroDecoration[];
  actions?: ReactNode;
  size?: HeroHeaderSize;
  className?: string;
  "data-testid"?: string;
};

const sizeClassName: Record<HeroHeaderSize, string> = {
  default: "p-6",
  roomy: "px-6 py-8 sm:px-8 sm:py-10",
};

const defaultDecorations: HeroDecoration[] = [
  { emoji: "✨", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
  { emoji: "⭐", className: "pointer-events-none absolute -bottom-3 left-8 text-6xl opacity-15 select-none" },
  { emoji: "🔢", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
];

export function HeroHeader({
  title,
  subtitle,
  decorations = defaultDecorations,
  actions,
  size = "default",
  className,
  "data-testid": testId,
}: HeroHeaderProps) {
  const merged = [
    "relative mb-6 overflow-hidden rounded-panel border border-[#e7defb] bg-[linear-gradient(135deg,#efe9ff_0%,#f6f0fb_55%,#fbf4ee_100%)] text-center shadow-md",
    sizeClassName[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header data-testid={testId} className={merged}>
      {decorations.map((d, idx) => (
        <span
          data-testid={testId ? childTid(testId, "decoration", idx) : undefined}
          key={`${d.emoji}-${idx}`}
          className={d.className}
          aria-hidden
        >
          {d.emoji}
        </span>
      ))}

      <div data-testid={testId ? childTid(testId, "content") : undefined} className="relative">
        <h1 data-testid={testId ? childTid(testId, "title") : undefined} className="text-[26px] font-bold leading-tight text-[var(--title)]">
          {title}
        </h1>
        {subtitle ? (
          <p data-testid={testId ? childTid(testId, "subtitle") : undefined} className="mt-2 text-sm text-[var(--muted)]">
            {subtitle}
          </p>
        ) : null}
        {actions ? <div data-testid={testId ? childTid(testId, "actions") : undefined} className="mt-4">{actions}</div> : null}
      </div>
    </header>
  );
}

