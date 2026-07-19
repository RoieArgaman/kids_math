"use client";

import { useState } from "react";
import { BackLink } from "@/components/ui/BackLink";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ActionCard } from "@/components/ui/Card";
import { PinInput } from "@/components/ui/PinInput";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { useAdminSession } from "@/lib/hooks/useAdminSession";

export function AdminHubScreen() {
  const { isUnlocked, unlock, exit } = useAdminSession();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  function handleExitAdmin(): void {
    exit();
  }

  function handlePinSubmit(): void {
    const ok = unlock(pin);
    if (!ok) {
      setPinError("PIN שגוי, נסו שוב.");
      return;
    }
    setPinError("");
    setPin("");
  }

  const rootTid = testIds.screen.adminHub.root();

  if (!isUnlocked) {
    return (
      <CenteredPanel
        data-testid={rootTid}
        emoji="🔐"
        title="אזור הורים"
        description="לאחר הזנת קוד הגישה תיפתח בחירה בין ניהול התקדמות ללוח ההורים."
        actions={
          <div data-testid={childTid(rootTid, "pinPanel")} className="space-y-3 text-right">
            <PinInput
              id="admin-hub-pin"
              value={pin}
              onChange={setPin}
              onSubmit={handlePinSubmit}
              label="קוד גישה"
              submitLabel="כניסה"
              error={pinError || undefined}
              testIds={{
                label: childTid(rootTid, "pinLabel"),
                input: testIds.screen.adminHub.pinInput(),
                error: testIds.screen.adminHub.pinError(),
                submit: testIds.screen.adminHub.pinSubmit(),
              }}
            />
          </div>
        }
      />
    );
  }

  return (
    <main data-testid={rootTid} className="pb-10">
      <div data-testid={childTid(rootTid, "topNav")} className="mb-4 flex items-center gap-3">
        <BackLink
          data-testid={childTid(rootTid, "navBack")}
          href={routes.gradePicker()}
          variant="outline"
          onClick={handleExitAdmin}
        >
          חזרה למסך הראשי
        </BackLink>
      </div>

      <header data-testid={childTid(rootTid, "header")} className="mb-4 space-y-1 text-right">
        <h1 data-testid={childTid(rootTid, "title")} className="text-2xl font-bold text-[var(--title)]">
          אזור הורים
        </h1>
        <p data-testid={childTid(rootTid, "subtitle")} className="text-sm text-[var(--muted)]">
          בחרו לאן להיכנס. קוד הגישה יישאר פעיל עד שתצאו מהאזור.
        </p>
      </header>

      <div data-testid={childTid(rootTid, "cards")} className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          data-testid={testIds.screen.adminHub.progressCard()}
          bodyTestId={childTid(rootTid, "progressText")}
          emojiTestId={childTid(rootTid, "progressEmoji")}
          titleTestId={childTid(rootTid, "progressTitle")}
          subtitleTestId={childTid(rootTid, "progressSubtitle")}
          emoji="🛠️"
          title="ניהול התקדמות"
          subtitle="ניהול ימים ומקטעים (קיים)"
          cta={{
            href: routes.adminProgress(),
            label: "פתיחת ניהול",
            "data-testid": testIds.screen.adminHub.progressCardCta(),
          }}
        />

        <ActionCard
          data-testid={testIds.screen.adminHub.parentDashboardCard()}
          bodyTestId={childTid(rootTid, "parentDashboardText")}
          emojiTestId={childTid(rootTid, "parentDashboardEmoji")}
          titleTestId={childTid(rootTid, "parentDashboardTitle")}
          subtitleTestId={childTid(rootTid, "parentDashboardSubtitle")}
          emoji="📊"
          title="לוח הורים"
          subtitle="איך הולך לילד/ה — לצפייה בלבד"
          cta={{
            href: routes.parentDashboard(),
            label: "פתיחת לוח הורים",
            "data-testid": testIds.screen.adminHub.parentDashboardCardCta(),
          }}
        />
      </div>
    </main>
  );
}
