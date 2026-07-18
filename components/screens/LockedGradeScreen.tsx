import Link from "next/link";
import { childTid } from "@/lib/testIds";

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
    <main data-testid={rootTestId} className="flex min-h-screen items-center justify-center px-4">
      <div
        data-testid={childTid(rootTestId, "panel")}
        className="surface mx-auto w-full max-w-md rounded-3xl p-8 text-center shadow-lg"
      >
        <p data-testid={childTid(rootTestId, "emoji")} className="mb-2 text-6xl" aria-hidden="true">
          {emoji}
        </p>
        <h1 data-testid={childTid(rootTestId, "title")} className="mb-2 text-2xl font-bold text-[#2c2348]">
          {title}
        </h1>
        <p
          data-testid={reasonTestId ?? childTid(rootTestId, "reason")}
          className="mb-6 text-sm text-[#8a8298]"
        >
          {reason}
        </p>

        <div data-testid={childTid(rootTestId, "ctas")} className="space-y-3">
          <Link
            href={primary.href}
            data-testid={primary.testId}
            className="touch-button btn-accent inline-block w-full rounded-2xl px-6 py-3 text-center font-semibold shadow-xs"
          >
            {primary.label}
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              data-testid={secondary.testId}
              className="touch-button inline-block w-full rounded-2xl border border-[#e7defb] bg-white px-6 py-3 text-center font-semibold text-[#6d28d9] hover:bg-[#f7f4fd]"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
