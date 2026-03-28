"use client";

import { useEffect, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { logEvent } from "@/lib/analytics/events";
import type { GradeId } from "@/lib/grades";
import { useBadges } from "@/lib/hooks/useBadges";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";

export function BadgeGalleryScreen({ grade }: { grade: GradeId }) {
  const { badgeState, newlyUnlockedIds, markAllSeen, allBadges } = useBadges(grade);
  const [showTrophy, setShowTrophy] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (newlyUnlockedIds.length > 0) {
      setShowTrophy(true);
    } else {
      logEvent("badges_viewed", {
        payload: { grade, unlockedCount: badgeState.unlocked.length },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const unlockedIds = new Set(badgeState.unlocked.map((u) => u.id));
  const unlockedAtMap = Object.fromEntries(badgeState.unlocked.map((u) => [u.id, u.unlockedAt]));

  return (
    <main data-testid={testIds.screen.badges.root(grade)}>
      <div className="mb-4">
        <AppNavLink href={routes.gradeHome(grade)}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
      </div>

      <h1 className="mb-6 text-2xl font-extrabold text-purple-800">🏆 הַפְּרָסִים שֶׁלִּי</h1>

      <div className="grid grid-cols-2 gap-4">
        {allBadges.map((badge) => {
          const isUnlocked = unlockedIds.has(badge.id);
          const unlockedAt = unlockedAtMap[badge.id];

          return (
            <div
              key={badge.id}
              data-testid={testIds.screen.badges.badgeCard(badge.id)}
              className={`rounded-2xl border p-4 text-center shadow-sm transition-all ${
                isUnlocked
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-200 bg-slate-50 opacity-60 grayscale"
              }`}
            >
              <div className="mb-2 text-4xl">{badge.icon}</div>
              <div className="mb-1 text-sm font-bold text-slate-800">{badge.name}</div>
              {isUnlocked && unlockedAt ? (
                <div className="text-xs text-emerald-600">
                  {new Date(unlockedAt).toLocaleDateString("he-IL")}
                </div>
              ) : (
                <div className="text-xs text-slate-500">{badge.description}</div>
              )}
            </div>
          );
        })}
      </div>

      <TrophyUnlock
        visible={showTrophy}
        newBadgeIds={newlyUnlockedIds}
        onConfirm={() => {
          markAllSeen();
          setShowTrophy(false);
          logEvent("badges_viewed", {
            payload: { grade, unlockedCount: badgeState.unlocked.length },
          });
        }}
      />
    </main>
  );
}
