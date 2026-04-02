"use client";

import { useEffect, useRef, useState } from "react";

import { MAX_DAILY_WRONG_ANSWERS } from "@/lib/progress/engine";

interface UseDayResetOptions {
  wrongCount: number;
  resetDay: () => void;
  /** Called when the day is auto-reset due to too many wrong answers. */
  onReset: () => void;
}

export function useDayReset({ wrongCount, resetDay, onReset }: UseDayResetOptions): {
  resetNotice: string;
} {
  const [resetNotice, setResetNotice] = useState("");
  const resetNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (wrongCount < MAX_DAILY_WRONG_ANSWERS) {
      return;
    }
    if (resetNotice) {
      return;
    }
    resetDay();
    onReset();
    setResetNotice("הִגַּעַתְּ לְ-3 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ.");

    if (resetNoticeTimeoutRef.current) {
      clearTimeout(resetNoticeTimeoutRef.current);
    }
    resetNoticeTimeoutRef.current = setTimeout(() => {
      setResetNotice("");
    }, 5000);
  }, [wrongCount, resetDay, onReset, resetNotice]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetNoticeTimeoutRef.current) {
        clearTimeout(resetNoticeTimeoutRef.current);
      }
    };
  }, []);

  return { resetNotice };
}
