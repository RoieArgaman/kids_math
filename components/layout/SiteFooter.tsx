import Link from "next/link";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

const FOOTER_HEADING_ID = "km-site-footer-family-heading";

/** Decorative top edge; static SVG (no motion). Reserved height avoids CLS. */
function FooterWave() {
  return (
    <div
      data-testid={testIds.layout.siteFooter.wave()}
      className="pointer-events-none h-12 w-full shrink-0 overflow-hidden"
      aria-hidden
    >
      <svg
        data-testid={testIds.layout.siteFooter.waveSvg()}
        className="block h-12 w-full min-h-[3rem]"
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          data-testid={testIds.layout.siteFooter.wavePath()}
          fill="var(--background)"
          d="M0,28 C200,8 400,44 600,28 C800,12 1000,40 1200,24 L1200,48 L0,48 Z"
        />
      </svg>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer
      data-testid={testIds.layout.siteFooter.root()}
      className="mt-auto bg-gradient-to-b from-transparent to-violet-50/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
    >
      <FooterWave />
      <div
        data-testid={testIds.layout.siteFooter.content()}
        className="border-t border-violet-100/80 bg-gradient-to-b from-[#fffefb] to-violet-50/35 px-4 pb-6 pt-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
      >
        <section
          data-testid={testIds.layout.siteFooter.section()}
          className="mx-auto max-w-[720px]"
          aria-labelledby={FOOTER_HEADING_ID}
        >
          <h2
            data-testid={testIds.layout.siteFooter.heading()}
            id={FOOTER_HEADING_ID}
            className="mb-3 text-center text-base font-bold tracking-tight text-violet-950"
          >
            מידע למשפחה
          </h2>
          <div
            data-testid={testIds.layout.siteFooter.tray()}
            className="surface rounded-3xl p-4 sm:p-5"
          >
            <nav
              data-testid={testIds.layout.siteFooter.nav()}
              aria-label="קישורים משפטיים"
              className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4"
            >
              <Link
                data-testid={testIds.layout.siteFooter.linkPrivacy()}
                href={routes.privacy()}
                className="group inline-flex min-h-[44px] flex-1 flex-col justify-center rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-white to-sky-50/60 px-4 py-3 text-center shadow-sm ring-1 ring-sky-100/60 transition hover:border-sky-300 hover:shadow-md motion-reduce:transition-none sm:text-start"
              >
                <span
                  data-testid={testIds.layout.siteFooter.tilePrivacyRow()}
                  className="inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start"
                >
                  <span
                    data-testid={testIds.layout.siteFooter.tilePrivacyEmoji()}
                    className="text-lg leading-none"
                    aria-hidden
                  >
                    🛡️
                  </span>
                  <span
                    data-testid={testIds.layout.siteFooter.tilePrivacyTitle()}
                    className="text-sm font-bold text-violet-950"
                  >
                    מדיניות פרטיות
                  </span>
                </span>
                <span
                  data-testid={testIds.layout.siteFooter.tilePrivacyHint()}
                  className="mt-1.5 block text-xs font-medium text-slate-600"
                >
                  הגנה על מידע אישי
                </span>
              </Link>
              <span
                data-testid={testIds.layout.siteFooter.sep()}
                className="hidden shrink-0 select-none text-lg text-violet-300 sm:inline"
                aria-hidden
              >
                ·
              </span>
              <Link
                data-testid={testIds.layout.siteFooter.linkCookies()}
                href={routes.cookies()}
                className="group inline-flex min-h-[44px] flex-1 flex-col justify-center rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-white to-amber-50/50 px-4 py-3 text-center shadow-sm ring-1 ring-amber-100/70 transition hover:border-amber-300 hover:shadow-md motion-reduce:transition-none sm:text-start"
              >
                <span
                  data-testid={testIds.layout.siteFooter.tileCookiesRow()}
                  className="inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start"
                >
                  <span
                    data-testid={testIds.layout.siteFooter.tileCookiesEmoji()}
                    className="text-lg leading-none"
                    aria-hidden
                  >
                    🍪
                  </span>
                  <span
                    data-testid={testIds.layout.siteFooter.tileCookiesTitle()}
                    className="text-sm font-bold text-violet-950"
                  >
                    מדיניות עוגיות
                  </span>
                </span>
                <span
                  data-testid={testIds.layout.siteFooter.tileCookiesHint()}
                  className="mt-1.5 block text-xs font-medium text-slate-600"
                >
                  שקיפות על עוגיות ואחסון
                </span>
              </Link>
            </nav>
          </div>
          <p
            data-testid={testIds.layout.siteFooter.note()}
            className="mt-4 space-y-1.5 text-center text-sm leading-relaxed text-slate-600"
          >
            <span data-testid={testIds.layout.siteFooter.noteLine1()} className="block">
              מידע חשוב להורים ולמטפלים.
            </span>
            <span data-testid={testIds.layout.siteFooter.noteLine2()} className="block">
              השימוש באפליקציה כפוף למסמכים המשפטיים בקישורים למעלה.
            </span>
          </p>
        </section>
      </div>
    </footer>
  );
}
