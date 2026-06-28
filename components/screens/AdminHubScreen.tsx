"use client";

import { useEffect, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { Surface } from "@/components/ui/Surface";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { clearAdminSession, isAdminUnlocked, unlockAdminSession } from "@/lib/admin/session";

export function AdminHubScreen() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    setIsUnlocked(isAdminUnlocked());
  }, []);

  // Keep the unlock alive across in-app (client-side) navigation between admin
  // screens. `pagehide` still clears it on tab close / reload / hard exit, and the
  // session carries a TTL. We deliberately do NOT clear on unmount — otherwise
  // moving hub → progress / parent-dashboard would wipe the unlock and re-prompt
  // the PIN. The unlock is cleared explicitly only when leaving the admin area
  // via "חזרה למסך הראשי".
  useEffect(() => {
    const onPageHide = () => {
      clearAdminSession();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  function handleExitAdmin(): void {
    clearAdminSession();
    setIsUnlocked(false);
  }

  function handlePinSubmit(): void {
    const ok = unlockAdminSession(pin);
    if (!ok) {
      setPinError("PIN שגוי, נסו שוב.");
      return;
    }
    setPinError("");
    setPin("");
    setIsUnlocked(true);
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
            <label data-testid={childTid(rootTid, "pinLabel")} htmlFor="admin-hub-pin" className="block text-sm font-semibold text-[#4f4860]">
              קוד גישה
            </label>
            <input
              id="admin-hub-pin"
              data-testid={testIds.screen.adminHub.pinInput()}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa]"
              type="password"
              inputMode="numeric"
              dir="ltr"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handlePinSubmit();
              }}
              aria-invalid={pinError ? "true" : "false"}
              aria-describedby={pinError ? "admin-hub-pin-error" : undefined}
            />
            {pinError ? (
              <p
                id="admin-hub-pin-error"
                data-testid={testIds.screen.adminHub.pinError()}
                className="text-sm font-semibold text-[#b91c1c]"
              >
                {pinError}
              </p>
            ) : null}
            <Button data-testid={testIds.screen.adminHub.pinSubmit()} className="w-full" onClick={handlePinSubmit}>
              כניסה
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <main data-testid={rootTid} className="pb-10">
      <div data-testid={childTid(rootTid, "topNav")} className="mb-4 flex items-center gap-3">
        <ButtonLink
          data-testid={childTid(rootTid, "navBack")}
          href={routes.gradePicker()}
          variant="outline"
          onClick={handleExitAdmin}
        >
          חזרה למסך הראשי
        </ButtonLink>
      </div>

      <header data-testid={childTid(rootTid, "header")} className="mb-4 space-y-1 text-right">
        <h1 data-testid={childTid(rootTid, "title")} className="text-2xl font-bold text-[#2c2348]">
          אזור הורים
        </h1>
        <p data-testid={childTid(rootTid, "subtitle")} className="text-sm text-[#8a8298]">
          בחרו לאן להיכנס. קוד הגישה יישאר פעיל עד שתצאו מהאזור.
        </p>
      </header>

      <div data-testid={childTid(rootTid, "cards")} className="grid gap-4 sm:grid-cols-2">
        <Surface data-testid={testIds.screen.adminHub.progressCard()} className="space-y-3 p-5 text-right">
          <p data-testid={childTid(rootTid, "progressEmoji")} className="text-5xl" aria-hidden>
            🛠️
          </p>
          <h2 data-testid={childTid(rootTid, "progressTitle")} className="text-xl font-bold text-[#2c2348]">
            ניהול התקדמות
          </h2>
          <p data-testid={childTid(rootTid, "progressSubtitle")} className="text-sm text-[#8a8298]">
            ניהול ימים ומקטעים (קיים)
          </p>
          <ButtonLink
            data-testid={testIds.screen.adminHub.progressCardCta()}
            href={routes.adminProgress()}
            className="inline-flex w-full justify-center text-center"
          >
            פתיחת ניהול
          </ButtonLink>
        </Surface>

        <Surface data-testid={testIds.screen.adminHub.parentDashboardCard()} className="space-y-3 p-5 text-right">
          <p data-testid={childTid(rootTid, "parentDashboardEmoji")} className="text-5xl" aria-hidden>
            📊
          </p>
          <h2 data-testid={childTid(rootTid, "parentDashboardTitle")} className="text-xl font-bold text-[#2c2348]">
            לוח הורים
          </h2>
          <p data-testid={childTid(rootTid, "parentDashboardSubtitle")} className="text-sm text-[#8a8298]">
            איך הולך לילד/ה — לצפייה בלבד
          </p>
          <ButtonLink
            data-testid={testIds.screen.adminHub.parentDashboardCardCta()}
            href={routes.parentDashboard()}
            className="inline-flex w-full justify-center text-center"
          >
            פתיחת לוח הורים
          </ButtonLink>
        </Surface>
      </div>
    </main>
  );
}
