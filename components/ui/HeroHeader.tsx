import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type HeroDecoration = {
  emoji: string;
  className: string;
};

export type HeroHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  decorations?: HeroDecoration[];
  actions?: ReactNode;
  className?: string;
  "data-testid"?: string;
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
  className,
  "data-testid": testId,
}: HeroHeaderProps) {
  const merged = [
    "relative mb-6 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-l from-violet-200 to-sky-100 p-6 shadow-md",
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
        <h1 data-testid={testId ? childTid(testId, "title") : undefined} className="text-4xl font-bold leading-tight text-violet-900">
          {title}
        </h1>
        {subtitle ? (
          <p data-testid={testId ? childTid(testId, "subtitle") : undefined} className="mt-2 text-sm text-violet-700">
            {subtitle}
          </p>
        ) : null}
        {actions ? <div data-testid={testId ? childTid(testId, "actions") : undefined} className="mt-4">{actions}</div> : null}
      </div>
    </header>
  );
}

