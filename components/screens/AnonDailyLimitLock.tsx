"use client";

import { useState } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { Button } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { LoginModal } from "@/components/auth/LoginModal";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { Subject } from "@/lib/subjects";

/**
 * Freemium daily-cap lock (Phase 5). Shown when an anonymous visitor has already
 * used today's one free day and tries to open a different day or subject. Built on
 * the shared `CenteredPanel` (the same shell the grade-B `LockedGradeScreen` uses),
 * but a CLIENT component because its primary CTA opens the `LoginModal` (an onClick)
 * rather than navigating — which the server-rendered `LockedGradeScreen` can't host.
 *
 * The copy is a warm, blame-free nudge: come back tomorrow, or log in to continue
 * now. No account is created here — signup is a separate phase.
 */
export function AnonDailyLimitLock({ subject }: { subject: Subject }) {
  const [showLogin, setShowLogin] = useState(false);
  const root = testIds.screen.anonDailyLimit.root(subject);

  return (
    <>
      <CenteredPanel
        as="main"
        data-testid={root}
        descriptionTestId={testIds.screen.anonDailyLimit.reason(subject)}
        emoji="🌙"
        title="סִיַּמְנוּ אֶת הַיּוֹם הַחִינָּמִי!"
        description="כָּל יוֹם אֶפְשָׁר לִלְמֹד יוֹם אֶחָד חִינָּם. אֶפְשָׁר לַחֲזוֹר מָחָר, אוֹ לְהִתְחַבֵּר כְּדֵי לְהַמְשִׁיךְ לִלְמֹד עַכְשָׁיו."
        actions={
          <div data-testid={childTid(root, "ctas")} className="space-y-3">
            <Button
              variant="accent"
              type="button"
              data-testid={testIds.screen.anonDailyLimit.loginCta(subject)}
              onClick={() => setShowLogin(true)}
              className="w-full"
            >
              לְהִתְחַבֵּר וּלְהַמְשִׁיךְ
            </Button>
            <BackLink
              href={routes.gradePicker()}
              data-testid={testIds.screen.anonDailyLimit.backCta(subject)}
              className="w-full text-center"
            >
              חֲזָרָה הַבַּיְתָה
            </BackLink>
          </div>
        }
      />
      {showLogin ? <LoginModal onClose={() => setShowLogin(false)} /> : null}
    </>
  );
}
