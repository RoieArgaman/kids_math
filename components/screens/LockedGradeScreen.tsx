import Link from "next/link";
import { childTid } from "@/lib/testIds";
import { CenteredPanel } from "@/components/ui/CenteredPanel";

export type LockedGradeCta = {
  href: string;
  label: string;
  testId: string;
};

export type LockedGradeScreenProps = {
  rootTestId: string;
  /** Optional reason testId — falls back to a child of root. */
  reasonTestId?: string;
  emoji?: string;
  title: string;
  /** Why it's locked AND how to unlock it (states both, per UX_QA). */
  reason: string;
  primary: LockedGradeCta;
  secondary?: LockedGradeCta;
};

/**
 * Shared locked screen for every grade-B gate (math / english / science subtrees
 * and the grade-level `/subjects/b`). Always states WHY it's locked and HOW to
 * unlock it, with a CTA back to the relevant picker/exam. Server-rendered — the
 * middleware is the real gate; this is what the learner lands on after a redirect.
 *
 * Built on `CenteredPanel` (roadmap 3.5.4b): this used to hand-roll a second
 * centred-panel shell that differed only by width, radius and shadow.
 */
export function LockedGradeScreen({
  rootTestId,
  reasonTestId,
  emoji = "🔒",
  title,
  reason,
  primary,
  secondary,
}: LockedGradeScreenProps) {
  return (
    <CenteredPanel
        as="main"
        data-testid={rootTestId}
        descriptionTestId={reasonTestId ?? childTid(rootTestId, "reason")}
        emoji={emoji}
        title={title}
        description={reason}
        actions={
          <div data-testid={childTid(rootTestId, "ctas")} className="space-y-3">
            <Link
              href={primary.href}
              data-testid={primary.testId}
              className="touch-button btn-accent inline-block w-full rounded-card px-6 py-3 text-center font-semibold shadow-xs"
            >
              {primary.label}
            </Link>
            {secondary ? (
              <Link
                href={secondary.href}
                data-testid={secondary.testId}
                className="touch-button inline-block w-full rounded-card border border-[#e7defb] bg-white px-6 py-3 text-center font-semibold text-[var(--accent-strong)] hover:bg-[#f7f4fd]"
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        }
      />
  );
}
