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
  /** Override for the description's testid. Screens that already published a
   *  different name for this slot (e.g. lockedGrade's `reason`) keep it when they
   *  move onto this shell, so their specs don't churn. */
  descriptionTestId?: string;
  /** Render the title as a real heading when this panel IS the page (locked/404
   *  screens). Defaults to `div` so existing call sites are untouched — several of
   *  them still have no heading at all, tracked as D14. */
  titleAs?: "div" | "h1";
  /** Render the outer element as the page's `main` landmark when this panel IS the
   *  page. Keeps the root testid on one element instead of duplicating it onto a
   *  wrapper (which `check:testids` requires on every `<main>`). */
  as?: "div" | "main";
};

export function CenteredPanel({
  emoji,
  title,
  description,
  actions,
  surfaceVariant = "default",
  className,
  "data-testid": testId,
  descriptionTestId,
  titleAs: TitleTag = "div",
  as: Root = "div",
}: CenteredPanelProps) {
  return (
    <Root data-testid={testId} className={["flex min-h-screen items-center justify-center", className].filter(Boolean).join(" ")}>
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
          <TitleTag data-testid={testId ? childTid(testId, "title") : undefined} className="mb-2 text-xl font-bold text-[var(--title)]">
            {title}
          </TitleTag>
          {description ? (
            <div data-testid={descriptionTestId ?? (testId ? childTid(testId, "description") : undefined)} className="mb-6 text-sm text-[var(--muted)]">
              {description}
            </div>
          ) : null}
          {actions ? <div data-testid={testId ? childTid(testId, "actions") : undefined}>{actions}</div> : null}
        </div>
      </Surface>
    </Root>
  );
}

