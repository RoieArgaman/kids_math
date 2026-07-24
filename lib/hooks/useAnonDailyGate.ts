"use client";

import { useEffect, useState } from "react";

import {
  claimAnonDaySlot,
  isBlockedByAnonDailyLimit,
} from "@/lib/access/anonDailyLimit";
import { useAuth } from "@/lib/auth/context";
import { usePreviewAll } from "@/lib/hooks/usePreviewAll";
import type { Subject } from "@/lib/subjects";
import type { DayId } from "@/lib/types";

export type AnonDailyGateDecision = "loading" | "allowed" | "blocked";

/**
 * Freemium day-entry gate (Phase 5). Decides whether an anonymous visitor may open
 * a given workbook day, and claims today's single free slot only when access is
 * actually granted.
 *
 * Correctness hinges on three guards:
 *  - It stays `"loading"` until auth has SETTLED (`!isLoading`) and the client has
 *    mounted (`isRouteReady`). Before that, `isLoggedIn` is `false` only because the
 *    state is UNKNOWN — deciding then would misclassify a logged-in child as
 *    anonymous. Callers must NOT block rendering on `"loading"` (only act on
 *    `"blocked"`), so a logged-in child never waits on auth to see a day that is
 *    already available locally.
 *  - Logged-in users and the dev/localhost `previewAll` QA bypass are NEVER metered.
 *  - The slot is claimed ONLY when `canClaim` is true — i.e. the day actually exists
 *    and is unlocked. Claiming on a not-found or progression-locked day would burn
 *    the visitor's whole free day on a page they never got to use.
 */
export function useAnonDailyGate(
  subject: Subject,
  dayId: DayId,
  canClaim: boolean = true,
): AnonDailyGateDecision {
  const { isLoggedIn, isLoading } = useAuth();
  const { previewAll, isRouteReady } = usePreviewAll();
  const [decision, setDecision] = useState<AnonDailyGateDecision>("loading");

  useEffect(() => {
    if (isLoading || !isRouteReady) {
      setDecision("loading");
      return;
    }
    if (isLoggedIn || previewAll) {
      setDecision("allowed");
      return;
    }
    if (isBlockedByAnonDailyLimit(subject, dayId)) {
      setDecision("blocked");
      return;
    }
    setDecision("allowed");
    // Claim only once the day is confirmed accessible — never on a not-found or
    // progression-locked day (which the caller renders instead of the day itself).
    if (canClaim) {
      claimAnonDaySlot(subject, dayId);
    }
  }, [isLoggedIn, isLoading, previewAll, isRouteReady, subject, dayId, canClaim]);

  return decision;
}
