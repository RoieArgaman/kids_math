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
        className="mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg"
      >
        {emoji ? (
          <p data-testid={testId ? childTid(testId, "emoji") : undefined} className="mb-2 text-6xl" aria-hidden>
            {emoji}
          </p>
        ) : null}
        <div data-testid={testId ? childTid(testId, "body") : undefined}>
          <div data-testid={testId ? childTid(testId, "title") : undefined} className="mb-2 text-xl font-semibold text-gray-800">
            {title}
          </div>
          {description ? (
            <div data-testid={testId ? childTid(testId, "description") : undefined} className="mb-6 text-sm text-gray-500">
              {description}
            </div>
          ) : null}
          {actions ? <div data-testid={testId ? childTid(testId, "actions") : undefined}>{actions}</div> : null}
        </div>
      </Surface>
    </div>
  );
}

