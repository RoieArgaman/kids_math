import { useEffect } from "react";
import { Chip } from "@/components/ui/Chip";
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

  return (
    <div data-testid={testId}>
      <Chip tone="warning">🔥 {streakLabel}</Chip>
      <div aria-live="polite">
        {newlyEarnedBadge && (
          <Chip tone="success">{STREAK_BADGE_LABELS[newlyEarnedBadge]}</Chip>
        )}
      </div>
    </div>
  );
}
