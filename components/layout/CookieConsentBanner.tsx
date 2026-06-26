"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getCookieConsentAccepted, setCookieConsentAccepted } from "@/lib/cookieConsent/storage";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";

/**
 * Fixed bottom overlay: does not reserve flex space (footer sits at the real bottom on short pages).
 * z-40: above `.progress-sticky` (30), below `.star-reward-overlay` (90) so rewards/modals stay on top.
 * Opaque background + normal pointer events so taps do not hit footer links underneath.
 * DOM stays before SiteFooter so Tab / SR order reaches consent actions before footer links.
 */
export function CookieConsentBanner() {
  const root = testIds.layout.cookieConsent.root();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setOpen(!getCookieConsentAccepted());
  }, []);

  const onAccept = useCallback(() => {
    setCookieConsentAccepted();
    setOpen(false);
  }, []);

  if (!hydrated || !open) {
    return null;
  }

  return (
    <div
      data-testid={root}
      className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-[#e7defb] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(80,60,140,0.10)] motion-safe:animate-cookie-banner-in motion-reduce:animate-none"
      role="region"
      aria-label="הודעה על עוגיות ואחסון מקומי"
    >
      <div
        data-testid={childTid(root, "panel")}
        className="mx-auto flex w-full max-w-[720px] flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3.5"
      >
        <p
          data-testid={childTid(root, "message")}
          className="text-center text-sm leading-relaxed text-[#6b6577] sm:text-right sm:text-[0.95rem]"
        >
          אנחנו משתמשים בעוגיות טכניות ובאחסון מקומי כדי שהאפליקציה תעבוד ותזכור את ההתקדמות. אפשר לקרוא עוד ב
          <Link
            data-testid={childTid(root, "link", "cookies")}
            className="mx-1 font-semibold text-[#6d28d9] underline decoration-[#cdbff2] underline-offset-2 hover:text-[#2c2348]"
            href={routes.cookies()}
          >
            מדיניות העוגיות
          </Link>
          .
        </p>
        <div
          data-testid={childTid(root, "actions")}
          className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3"
        >
          <Link
            data-testid={childTid(root, "link", "privacy")}
            className="touch-button inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#e7defb] bg-white px-4 text-sm font-semibold text-[#6d28d9] hover:bg-[#f7f4fd]"
            href={routes.privacy()}
          >
            פרטיות
          </Link>
          <Button
            data-testid={childTid(root, "cta", "accept")}
            type="button"
            variant="accent"
            className="min-h-[48px] w-full px-6 text-base font-bold shadow-md sm:w-auto"
            onClick={onAccept}
          >
            הבנתי ומאשר/ת
          </Button>
        </div>
      </div>
    </div>
  );
}
