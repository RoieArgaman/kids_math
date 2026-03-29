"use client";

import { useEffect, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { logEvent } from "@/lib/analytics/events";
import type { GradeId } from "@/lib/grades";
import { useBadges } from "@/lib/hooks/useBadges";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { BadgeId, BadgeTier, BadgeDefinition } from "@/lib/badges/types";

const BADGE_CATEGORIES: { label: string; ids: BadgeId[] }[] = [
  {
    label: "📈 התקדמות",
    ids: ["first-day-done", "halfway-there", "streak-3-days", "streak-5-days", "streak-10-days"],
  },
  {
    label: "📅 שבועות",
    ids: ["week-1-complete", "week-2-complete", "week-3-complete", "week-4-complete"],
  },
  {
    label: "🎯 דיוק",
    ids: [
      "zero-mistakes", "sharp-mind", "flawless-five", "zero-hero",
      "perfect-week", "perfect-two-weeks",
    ],
  },
  {
    label: "⚡ מהירות",
    ids: ["speed-runner", "lightning-fast", "speed-trio"],
  },
  {
    label: "💪 התמדה",
    ids: ["comeback-kid", "iron-will", "ten-and-done"],
  },
  {
    label: "⏰ תזמון",
    ids: ["early-bird", "weekend-warrior"],
  },
  {
    label: "🗓️ ימים רצופים",
    ids: ["calendar-streak-3", "calendar-streak-7"],
  },
  {
    label: "📚 תחומי לימוד",
    ids: ["strand-numbers", "strand-operations", "strand-geometry", "strand-advanced"],
  },
  {
    label: "📝 מבחן",
    ids: ["exam-high-score", "exam-ace"],
  },
  {
    label: "💬 מאמץ",
    ids: ["hundred-answers", "five-hundred-answers"],
  },
  {
    label: "🏆 מצטיין",
    ids: ["grand-master", "grade-a-graduate", "grade-b-graduate"],
  },
];

function formatUnlockDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL");
}

const TIER_BORDER: Record<BadgeTier, string> = {
  bronze:   "border-amber-300",
  silver:   "border-slate-400",
  gold:     "border-yellow-400",
  platinum: "border-purple-500",
};

const TIER_BG: Record<BadgeTier, string> = {
  bronze:   "bg-amber-50",
  silver:   "bg-slate-50",
  gold:     "bg-yellow-50",
  platinum: "bg-purple-50",
};

const TIER_LABEL: Record<BadgeTier, string> = {
  bronze:   "ברונזה",
  silver:   "כסף",
  gold:     "זהב",
  platinum: "פלטינה",
};

export function BadgeGalleryScreen({ grade }: { grade: GradeId }) {
  const { badgeState, newlyUnlockedIds, markAllSeen, allBadges } = useBadges(grade);
  const [showTrophy, setShowTrophy] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [openTooltipId, setOpenTooltipId] = useState<BadgeId | null>(null);

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

  useEffect(() => {
    const close = () => setOpenTooltipId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const unlockedIds = new Set(badgeState.unlocked.map((u) => u.id));
  const unlockedAtMap = Object.fromEntries(badgeState.unlocked.map((u) => [u.id, u.unlockedAt]));
  const badgesRoot = testIds.screen.badges.root(grade);

  // Badges unlocked within the last 24 hours get a glow animation
  const recentlyUnlockedIds = new Set(
    badgeState.unlocked
      .filter((u) => Date.now() - new Date(u.unlockedAt).getTime() < 86_400_000)
      .map((u) => u.id),
  );

  // Build a lookup from id → BadgeDefinition for fast access
  const badgeById = Object.fromEntries(allBadges.map((b) => [b.id, b]));

  return (
    <main data-testid={badgesRoot}>
      {/* Navigation */}
      <div data-testid={childTid(badgesRoot, "nav")} className="mb-4">
        <AppNavLink href={routes.gradeHome(grade)}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
      </div>

      {/* Title */}
      <h1
        data-testid={childTid(badgesRoot, "title")}
        className="mb-4 text-2xl font-extrabold text-purple-800"
      >
        🏆 הַפְּרָסִים שֶׁלִּי
      </h1>

      {/* Empty state — shown only when nothing is unlocked yet */}
      {badgeState.unlocked.length === 0 && (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"
          dir="rtl"
        >
          <div className="mb-2 text-4xl">🌟</div>
          <div className="mb-1 text-base font-bold text-amber-800">הפרסים מחכים לך!</div>
          <div className="text-sm text-amber-600">
            השלם ימים והצלח בתרגילים כדי לאסוף פרסים
          </div>
        </div>
      )}

      {/* Progress counter */}
      <div
        className="mb-6 flex items-center justify-between rounded-xl bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700"
        dir="rtl"
      >
        <span>🏅 הפרסים שלי</span>
        <span>
          {badgeState.unlocked.length} / {allBadges.length}
        </span>
      </div>

      {/* Grouped badge sections */}
      {BADGE_CATEGORIES.map((cat) => {
        // Filter to badges that exist in allBadges (guards against missing IDs after removals)
        const catBadges = cat.ids
          .map((id) => badgeById[id])
          .filter((b): b is BadgeDefinition => b !== undefined);
        if (catBadges.length === 0) return null;

        return (
          <section key={cat.label} className="mb-8" dir="rtl">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
              {cat.label}
            </h2>
            <div
              data-testid={childTid(badgesRoot, "grid")}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {catBadges.map((badge) => {
                const isUnlocked = unlockedIds.has(badge.id);
                const unlockedAt = unlockedAtMap[badge.id];
                const cardTid = testIds.screen.badges.badgeCard(badge.id);
                const isRecentlyUnlocked = recentlyUnlockedIds.has(badge.id);
                const isTooltipOpen = openTooltipId === badge.id;

                return (
                  <div
                    key={badge.id}
                    data-testid={cardTid}
                    className={[
                      "group relative rounded-2xl border p-4 text-center shadow-sm transition-all cursor-pointer",
                      isUnlocked
                        ? `${TIER_BORDER[badge.tier]} ${TIER_BG[badge.tier]}`
                        : `${TIER_BORDER[badge.tier]} ${TIER_BG[badge.tier]} opacity-50 grayscale`,
                      isRecentlyUnlocked ? "badge-new-glow" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTooltipId((prev) =>
                        prev === badge.id ? null : badge.id,
                      );
                    }}
                  >
                    {/* Tier label */}
                    <span className="absolute right-2 top-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {TIER_LABEL[badge.tier]}
                    </span>

                    {/* Hover / tap tooltip */}
                    <div
                      className={[
                        "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48",
                        "-translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2 text-center",
                        "text-xs leading-snug text-white shadow-lg transition-opacity duration-150",
                        isTooltipOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                      dir="rtl"
                    >
                      {badge.description}
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>

                    {/* Icon with lock overlay */}
                    <div
                      data-testid={childTid(cardTid, "icon")}
                      className="relative mb-2 inline-block"
                    >
                      <span className="text-4xl">{badge.icon}</span>
                      {!isUnlocked && (
                        <span className="absolute -bottom-1 -right-1 text-base">🔒</span>
                      )}
                    </div>

                    {/* Badge name */}
                    <div
                      data-testid={childTid(cardTid, "name")}
                      className="mb-1 text-sm font-bold text-slate-800"
                    >
                      {badge.name}
                    </div>

                    {/* Unlocked: show relative date + description */}
                    {isUnlocked && unlockedAt ? (
                      <>
                        <div
                          data-testid={childTid(cardTid, "unlockedAt")}
                          className="text-xs text-emerald-600"
                        >
                          {formatUnlockDate(unlockedAt)}
                        </div>
                        <div
                          className="mt-1 text-xs leading-snug text-slate-500"
                          dir="rtl"
                        >
                          {badge.description}
                        </div>
                      </>
                    ) : (
                      /* Locked: show description as hint */
                      <div
                        data-testid={childTid(cardTid, "lockedHint")}
                        className="text-xs text-slate-600"
                      >
                        {badge.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

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
