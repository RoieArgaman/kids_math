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
 * a given workbook day, claiming today's single free slot on first allowed open.
 *
 * Correctness hinges on two guards:
 *  - It stays `"loading"` until auth has SETTLED (`!isLoading`) and the client has
 *    mounted (`isRouteReady`). Before that, `isLoggedIn` is `false` only because the
 *    state is UNKNOWN — deciding then would misclassify a logged-in child as
 *    anonymous and could prematurely claim a slot or flash the lock.
 *  - Logged-in users and the dev/localhost `previewAll` QA bypass are NEVER metered
 *    (short-circuit before any store read).
 */
export function useAnonDailyGate(subject: Subject, dayId: DayId): AnonDailyGateDecision {
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
    // Allowed anonymous open — claim today's slot (idempotent for the same day).
    claimAnonDaySlot(subject, dayId);
    setDecision("allowed");
  }, [isLoggedIn, isLoading, previewAll, isRouteReady, subject, dayId]);

  return decision;
}
