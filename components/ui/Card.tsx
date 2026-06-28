import type { ReactNode } from "react";
import { Surface, type SurfaceVariant } from "@/components/ui/Surface";
import { ButtonLink } from "@/components/ui/Button";
import { childTid } from "@/lib/testIds";

export type CardPadding = "sm" | "md" | "lg";

/** Canonical padding tokens. Applied on the Surface outer (where padding works). */
const PADDING_CLASS: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export type CardProps = {
  children: ReactNode;
  padding?: CardPadding;
  variant?: SurfaceVariant;
  className?: string;
  /**
   * Extra classes for the inner body wrapper Card controls. Use this for
   * vertical rhythm (e.g. `space-y-2`) — Surface's own single content child
   * silently drops layout classes, so Card owns a wrapper callers can rely on.
   * Defaults to nothing so existing markup stays visually identical.
   */
  bodyClassName?: string;
  "data-testid"?: string;
};

/**
 * Canonical card. Composes Surface (padding on the outer surface works) and
 * wraps children in a body `<div>` Card controls, so callers needing vertical
 * rhythm pass `bodyClassName="space-y-2"` and get predictable spacing instead
 * of having layout classes swallowed by Surface.
 */
export function Card({
  children,
  padding = "md",
  variant,
  className,
  bodyClassName,
  "data-testid": testId,
}: CardProps) {
  const surfaceClassName = [PADDING_CLASS[padding], className].filter(Boolean).join(" ");
  return (
    <Surface data-testid={testId} variant={variant} className={surfaceClassName}>
      {bodyClassName ? (
        <div data-testid={testId ? childTid(testId, "body") : undefined} className={bodyClassName}>
          {children}
        </div>
      ) : (
        children
      )}
    </Surface>
  );
}

export type ActionCardCta = {
  href: string;
  label: string;
  "data-testid"?: string;
};

export type ActionCardProps = {
  emoji?: string;
  title: string;
  subtitle?: string;
  cta: ActionCardCta;
  padding?: CardPadding;
  variant?: SurfaceVariant;
  "data-testid"?: string;
  /**
   * Optional inner testids. Lets adopting screens keep their exact existing
   * child test ids (body wrapper / emoji / title / subtitle) so adoption is a
   * zero-diff swap. Omit them for new call sites.
   */
  bodyTestId?: string;
  emojiTestId?: string;
  titleTestId?: string;
  subtitleTestId?: string;
};

/**
 * Card with a heading block and a full-width CTA. Reproduces the canonical
 * AdminHub action-card markup exactly:
 *   Surface(p-5 text-right) > div.space-y-2 { emoji? + title + subtitle? }
 *   + ButtonLink.mt-5.inline-flex.w-full.justify-center.text-center
 */
export function ActionCard({
  emoji,
  title,
  subtitle,
  cta,
  padding = "md",
  variant,
  "data-testid": testId,
  bodyTestId,
  emojiTestId,
  titleTestId,
  subtitleTestId,
}: ActionCardProps) {
  const surfaceClassName = [PADDING_CLASS[padding], "text-right"].join(" ");
  return (
    <Surface data-testid={testId} variant={variant} className={surfaceClassName}>
      <div data-testid={bodyTestId} className="space-y-2">
        {emoji ? (
          <p data-testid={emojiTestId} className="text-5xl" aria-hidden>
            {emoji}
          </p>
        ) : null}
        <h2 data-testid={titleTestId} className="text-xl font-bold text-[#2c2348]">
          {title}
        </h2>
        {subtitle ? (
          <p data-testid={subtitleTestId} className="text-sm text-[#8a8298]">
            {subtitle}
          </p>
        ) : null}
      </div>
      <ButtonLink
        data-testid={cta["data-testid"]}
        href={cta.href}
        className="mt-5 inline-flex w-full justify-center text-center"
      >
        {cta.label}
      </ButtonLink>
    </Surface>
  );
}
