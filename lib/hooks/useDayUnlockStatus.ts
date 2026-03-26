"use client";

import { useEffect, useState } from "react";

import { getWorkbookDays } from "@/lib/content/workbook";
import { canUnlockNextDay } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import type { GradeId } from "@/lib/grades";
import type { DayId } from "@/lib/types";
import { usePreviewAll } from "@/lib/hooks/usePreviewAll";

export function useDayUnlockStatus({
  grade,
  dayId,
}: {
  grade: GradeId;
  dayId: DayId;
}): { previewAll: boolean; isRouteReady: boolean; isLocked: boolean | null } {
  const { previewAll, isRouteReady } = usePreviewAll();
  const [isLocked, setIsLocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isRouteReady) {
      return;
    }

    if (previewAll) {
      setIsLocked(false);
      return;
    }

    const days = getWorkbookDays(grade);
    const dayIndex = days.findIndex((item) => item.id === dayId);
    if (dayIndex <= 0) {
      setIsLocked(false);
      return;
    }

    const previousDay = days[dayIndex - 1];
    const progress = loadProgressState({ grade });
    const previousProgress = progress.days[previousDay.id];
    setIsLocked(!canUnlockNextDay(previousDay, previousProgress));
  }, [dayId, grade, isRouteReady, previewAll]);

  return { previewAll, isRouteReady, isLocked };
}

