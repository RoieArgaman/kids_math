import { useEffect } from "react";
import { Chip } from "@/components/ui/Chip";
import { childTid, testIds } from "@/lib/testIds";
import type { StreakBadgeId } from "@/lib/streak/types";
import { STREAK_BADGE_LABELS } from "@/lib/streak/types";

interface StreakBadgeProps {
  currentStreak: number;
  newlyEarnedBadge: StreakBadgeId | null;
  onDismissBadge: () => void;
  "data-testid"?: string;
}

export function StreakBadge({
  currentStreak,
  newlyEarnedBadge,
  onDismissBadge,
  "data-testid": testId,
}: StreakBadgeProps) {
  useEffect(() => {
    if (!newlyEarnedBadge) return;
    const id = setTimeout(onDismissBadge, 4000);
    return () => clearTimeout(id);
  }, [newlyEarnedBadge, onDismissBadge]);

  const streakLabel = currentStreak === 1 ? "יום 1 ברצף" : `${currentStreak} ימים ברצף`;
  const rootTid = testId ?? testIds.component.streakBadge.root();

  return (
    <div data-testid={rootTid}>
      <Chip tone="warning">🔥 {streakLabel}</Chip>
      <div data-testid={childTid(rootTid, "liveRegion")} aria-live="polite">
        {newlyEarnedBadge && (
          <Chip tone="success">{STREAK_BADGE_LABELS[newlyEarnedBadge]}</Chip>
        )}
      </div>
    </div>
  );
}
