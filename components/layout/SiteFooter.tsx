import Link from "next/link";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

const FOOTER_HEADING_ID = "km-site-footer-family-heading";

export function SiteFooter() {
  return (
    <footer
      data-testid={testIds.layout.siteFooter.root()}
      className="mt-auto border-t border-[#efe9f7] bg-gradient-to-b from-[#fffefb] to-[#f7f4fd]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
    >
      <div
        data-testid={testIds.layout.siteFooter.content()}
        className="px-3 py-2 sm:px-4"
      >
        <section
          data-testid={testIds.layout.siteFooter.section()}
          className="mx-auto max-w-[720px]"
          aria-labelledby={FOOTER_HEADING_ID}
        >
          <h2
            data-testid={testIds.layout.siteFooter.heading()}
            id={FOOTER_HEADING_ID}
            className="mb-2 text-center text-xs font-bold tracking-tight text-[var(--title)]"
          >
            מידע למשפחה
          </h2>
          <nav
            data-testid={testIds.layout.siteFooter.nav()}
            aria-label="קישורים משפטיים"
            className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm"
          >
            <Link
              data-testid={testIds.layout.siteFooter.linkPrivacy()}
              href={routes.privacy()}
              className="inline-flex min-h-[44px] items-center rounded-lg px-2 py-1.5 font-semibold text-[var(--accent-strong)] underline decoration-[#cdbff2] underline-offset-2 transition hover:bg-[#f7f4fd] hover:text-[var(--title)] motion-reduce:transition-none"
            >
              מדיניות פרטיות
            </Link>
            <span
              data-testid={testIds.layout.siteFooter.sep()}
              className="select-none text-[#cdbff2]"
              aria-hidden
            >
              ·
            </span>
            <Link
              data-testid={testIds.layout.siteFooter.linkCookies()}
              href={routes.cookies()}
              className="inline-flex min-h-[44px] items-center rounded-lg px-2 py-1.5 font-semibold text-[var(--accent-strong)] underline decoration-[#cdbff2] underline-offset-2 transition hover:bg-[#f7f4fd] hover:text-[var(--title)] motion-reduce:transition-none"
            >
              מדיניות עוגיות
            </Link>
          </nav>
          <p
            data-testid={testIds.layout.siteFooter.note()}
            className="mt-2 text-center text-xs leading-snug text-[var(--muted)]"
          >
            מידע חשוב להורים ולמטפלים; השימוש באפליקציה כפוף למסמכים המשפטיים בקישורים למעלה.
          </p>
        </section>
      </div>
    </footer>
  );
}
