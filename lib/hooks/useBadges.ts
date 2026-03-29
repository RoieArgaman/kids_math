"use client";

import { useEffect, useState } from "react";
import type { GradeId } from "@/lib/grades";
import { loadProgressState } from "@/lib/progress/storage";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { getWorkbookDays } from "@/lib/content/workbook";
import { logEvent } from "@/lib/analytics/events";
import {
  BADGE_DEFINITIONS,
  evaluateBadges,
  loadBadgeState,
  saveBadgeState,
  createInitialBadgeState,
} from "@/lib/badges";
import type { BadgeDefinition, BadgeId, BadgeState } from "@/lib/badges";

export function useBadges(
  grade: GradeId,
  options?: {
    evaluateTrigger?: boolean;
    /**
     * Increment this counter to force a badge re-evaluation even when
     * `evaluateTrigger` has not changed. Used by DayScreen to re-check
     * speed badges after a speed-run improves `bestTimeMs`.
     */
    evaluateCounter?: number;
  },
): {
  badgeState: BadgeState;
  newlyUnlockedIds: BadgeId[];
  markAllSeen: () => void;
  allBadges: BadgeDefinition[];
} {
  const [badgeState, setBadgeState] = useState<BadgeState>(() => createInitialBadgeState(grade));

  useEffect(() => {
    const progress = loadProgressState({ grade });
    const finalExam = loadFinalExamState(grade);
    const curriculum = getWorkbookDays(grade);

    const earnedIds = evaluateBadges({ progress, finalExam, curriculum, grade });

    const current = loadBadgeState(grade);
    const alreadyUnlockedIds = new Set(current.unlocked.map((u) => u.id));
    const newIds = earnedIds.filter((id) => !alreadyUnlockedIds.has(id));

    if (newIds.length === 0) {
      setBadgeState(current);
      return;
    }

    const now = new Date().toISOString();
    const nextUnlocked = [
      ...current.unlocked,
      ...newIds.map((id) => ({ id, unlockedAt: now })),
    ];
    const nextState: BadgeState = {
      ...current,
      unlocked: nextUnlocked,
      updatedAt: now,
    };

    saveBadgeState(nextState);
    setBadgeState(nextState);

    for (const badgeId of newIds) {
      logEvent("badge_unlocked", { payload: { badgeId, grade } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, options?.evaluateTrigger, options?.evaluateCounter]);

  const newlyUnlockedIds = badgeState.unlocked
    .filter((u) => !badgeState.seenIds.includes(u.id))
    .map((u) => u.id);

  const markAllSeen = () => {
    const allUnlockedIds = badgeState.unlocked.map((u) => u.id);
    const nextState: BadgeState = {
      ...badgeState,
      seenIds: allUnlockedIds,
      updatedAt: new Date().toISOString(),
    };
    saveBadgeState(nextState);
    setBadgeState(nextState);
  };

  return {
    badgeState,
    newlyUnlockedIds,
    markAllSeen,
    allBadges: BADGE_DEFINITIONS,
  };
}
