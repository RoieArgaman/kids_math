import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";
import { Surface, type SurfaceVariant } from "@/components/ui/Surface";

export type CenteredPanelProps = {
  emoji?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  surfaceVariant?: SurfaceVariant;
  className?: string;
  "data-testid"?: string;
};

export function CenteredPanel({
  emoji,
  title,
  description,
  actions,
  surfaceVariant = "default",
  className,
  "data-testid": testId,
}: CenteredPanelProps) {
  return (
    <div data-testid={testId} className={["flex min-h-screen items-center justify-center", className].filter(Boolean).join(" ")}>
      <Surface
        data-testid={testId ? childTid(testId, "card") : undefined}
        variant={surfaceVariant}
        className="mx-auto max-w-sm rounded-card p-8 text-center shadow-[0_2px_14px_rgba(80,60,140,0.06)]"
      >
        {emoji ? (
          <p data-testid={testId ? childTid(testId, "emoji") : undefined} className="mb-2 text-6xl" aria-hidden>
            {emoji}
          </p>
        ) : null}
        <div data-testid={testId ? childTid(testId, "body") : undefined}>
          <div data-testid={testId ? childTid(testId, "title") : undefined} className="mb-2 text-xl font-bold text-[var(--title)]">
            {title}
          </div>
          {description ? (
            <div data-testid={testId ? childTid(testId, "description") : undefined} className="mb-6 text-sm text-[var(--muted)]">
              {description}
            </div>
          ) : null}
          {actions ? <div data-testid={testId ? childTid(testId, "actions") : undefined}>{actions}</div> : null}
        </div>
      </Surface>
    </div>
  );
}

