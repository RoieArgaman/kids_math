"use client";

import { useMemo, useState } from "react";
import { TapToPlayTtsButton } from "@/components/ui/TapToPlayTtsButton";
import { Surface } from "@/components/ui/Surface";
import { useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";
import { TeachingPrimerExpandToggle } from "@/components/teaching-primer/TeachingPrimerExpandToggle";
import { TeachingPrimerExpandedContent } from "@/components/teaching-primer/TeachingPrimerExpandedContent";
import {
  buildDayPrimerSpeakText,
  DAY_PRIMER_COLLAPSE_CHAR_THRESHOLD,
  hasDayTeachingPrimer,
} from "@/lib/content/buildDayPrimerSpeakText";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, WorkbookDay } from "@/lib/types";
import type { GradeId } from "@/lib/grades";

const PREVIEW_CHAR_LIMIT = 420;

type DayTeachingPrimerProps = {
  day: WorkbookDay;
  grade: GradeId;
  dayId: DayId;
};

export function DayTeachingPrimer({ day, grade, dayId }: DayTeachingPrimerProps) {
  const { ttsEnabled, hydrated } = useAdminTtsEnabled();
  const g = grade;
  const primerRoot = testIds.screen.dayOverview.teachingPrimer(g, dayId);
  const speakText = useMemo(() => buildDayPrimerSpeakText(day), [day]);

  const combinedForMeasure = useMemo(() => {
    const parts: string[] = [];
    if (day.teachingSummary?.trim()) parts.push(day.teachingSummary.trim());
    for (const s of day.teachingSteps ?? []) {
      if (s.trim()) parts.push(s.trim());
    }
    return parts.join("\n");
  }, [day.teachingSummary, day.teachingSteps]);

  const needsCollapse = useMemo(() => {
    const stepCount = day.teachingSteps?.filter((s) => s.trim()).length ?? 0;
    return (
      combinedForMeasure.length > DAY_PRIMER_COLLAPSE_CHAR_THRESHOLD || stepCount > 4
    );
  }, [combinedForMeasure, day.teachingSteps]);

  const [expanded, setExpanded] = useState(() => !needsCollapse);

  if (!hasDayTeachingPrimer(day)) {
    return null;
  }

  const showFull = !needsCollapse || expanded;
  const previewText =
    combinedForMeasure.length > PREVIEW_CHAR_LIMIT
      ? `${combinedForMeasure.slice(0, PREVIEW_CHAR_LIMIT).trim()}…`
      : combinedForMeasure;

  const summaryText = day.teachingSummary?.trim() ?? "";
  const stepItems = day.teachingSteps?.map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <Surface
      data-testid={primerRoot}
      variant="default"
      className="mb-4 border border-amber-200/80 bg-amber-50/90 shadow-sm"
    >
      <div
        data-testid={childTid(primerRoot, "topRow")}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <h2
          data-testid={childTid(primerRoot, "title")}
          className="text-lg font-bold text-amber-950"
        >
          לִפְנֵי שֶׁמַּתְחִילִים
        </h2>
        <TapToPlayTtsButton
          text={speakText}
          dataTestId={testIds.screen.dayOverview.teachingPrimerTts(g, dayId)}
          featureEnabled={hydrated && ttsEnabled}
          ariaLabel="הַשְׁמַע הַסְבָּר קָצָר"
          ariaLabelSpeaking="עֲצוֹר הַשְׁמָעָה"
        />
      </div>
      <div
        data-testid={childTid(primerRoot, "body")}
        className="mt-3 space-y-3 text-base leading-relaxed text-amber-950"
      >
        {showFull ? (
          <TeachingPrimerExpandedContent
            primerRoot={primerRoot}
            summaryText={summaryText}
            stepItems={stepItems}
          />
        ) : (
          <p data-testid={childTid(primerRoot, "preview")}>{previewText}</p>
        )}
      </div>
      {needsCollapse ? (
        <TeachingPrimerExpandToggle
          expanded={showFull}
          testId={testIds.screen.dayOverview.teachingPrimerExpand(g, dayId)}
          onToggle={() => setExpanded((e) => !e)}
        />
      ) : null}
    </Surface>
  );
}
