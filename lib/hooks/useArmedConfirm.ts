"use client";

import { useCallback, useState } from "react";

/**
 * Two-step "armed → confirm/cancel" state for a single family of rows.
 *
 * `armedId` is the id whose confirm panel is currently shown (or `null`). `isArmed(id)`
 * checks a specific row; `arm(id)` arms one; `disarm()` clears. Used for the day-level
 * and section-level reset flows in AdminProgressScreen, where arming one family must
 * also disarm the other — call the sibling's `disarm()` alongside `arm()`.
 */
export function useArmedConfirm<TId extends string = string>(): {
  armedId: TId | null;
  isArmed: (id: TId) => boolean;
  arm: (id: TId) => void;
  disarm: () => void;
  setArmedId: (id: TId | null) => void;
} {
  const [armedId, setArmedId] = useState<TId | null>(null);

  const isArmed = useCallback((id: TId) => armedId === id, [armedId]);
  const arm = useCallback((id: TId) => setArmedId(id), []);
  const disarm = useCallback(() => setArmedId(null), []);

  return { armedId, isArmed, arm, disarm, setArmedId };
}
