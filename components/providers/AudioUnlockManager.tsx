"use client";

import { useEffect } from "react";
import { unlockAudioPlayback } from "@/lib/tts/engine";

/**
 * Unlocks voice auto-play on the child's first interaction anywhere in the app.
 *
 * Browsers block audio started without a user gesture, so voice auto-play on
 * mount is silent until the first tap/click/key. This mounts once (via
 * AppProviders), primes audio inside that first gesture, then detaches — after
 * which auto-play (`autoSpeakHebrew*`) plays for the rest of the session.
 * Renders nothing.
 */
export function AudioUnlockManager() {
  useEffect(() => {
    const unlock = () => {
      // Must run inside the gesture handler to satisfy the autoplay policy.
      unlockAudioPlayback();
      detach();
    };
    const detach = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return detach;
  }, []);

  return null;
}
