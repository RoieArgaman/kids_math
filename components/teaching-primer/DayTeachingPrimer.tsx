"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TapToPlayTtsButton } from "@/components/ui/TapToPlayTtsButton";
import { Surface } from "@/components/ui/Surface";
import { useAdminTtsEnabled } from "@/components/providers/AdminTtsProvider";
import { useStudentTts } from "@/components/providers/StudentTtsProvider";
import { TeachingPrimerExpandToggle } from "@/components/teaching-primer/TeachingPrimerExpandToggle";
import { TeachingPrimerExpandedContent } from "@/components/teaching-primer/TeachingPrimerExpandedContent";
import {
  buildDayPrimerSpeakChunks,
  buildDayPrimerSpeakText,
  DAY_PRIMER_COLLAPSE_CHAR_THRESHOLD,
  hasDayTeachingPrimer,
} from "@/lib/content/buildDayPrimerSpeakText";
import { speakHebrewChunks } from "@/lib/tts/engine";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, WorkbookDay } from "@/lib/types";
import type { GradeId } from "@/lib/grades";

const PREVIEW_CHAR_LIMIT = 420;
const AUTO_PLAY_DELAY_MS = 1500;

function sessionKey(grade: GradeId, dayId: DayId): string {
  return `km_primer_played_${grade}_${dayId}`;
}

type DayTeachingPrimerProps = {
  day: WorkbookDay;
  grade: GradeId;
  dayId: DayId;
};

export function DayTeachingPrimer({ day, grade, dayId }: DayTeachingPrimerProps) {
  const { ttsEnabled, hydrated: adminHydrated } = useAdminTtsEnabled();
  const { autoPlay, hydrated: studentHydrated } = useStudentTts();
  const g = grade;
  const primerRoot = testIds.screen.dayOverview.teachingPrimer(g, dayId);
  const speakText = useMemo(() => buildDayPrimerSpeakText(day), [day]);
  const speakChunks = useMemo(() => buildDayPrimerSpeakChunks(day), [day]);

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

  // Auto-play primer on first visit in this browser session when autoPlay is enabled
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!adminHydrated || !studentHydrated) return;
    if (!ttsEnabled || !autoPlay) return;
    if (speakChunks.length === 0) return;

    try {
      const key = sessionKey(grade, dayId);
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }

    autoPlayTimerRef.current = setTimeout(() => {
      speakHebrewChunks(speakChunks);
    }, AUTO_PLAY_DELAY_MS);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [adminHydrated, studentHydrated, ttsEnabled, autoPlay, speakChunks, grade, dayId]);

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
      className="animate-bounce-in mb-4"
    >
      <div
        data-testid={childTid(primerRoot, "topRow")}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <h2
          data-testid={childTid(primerRoot, "title")}
          className="text-base font-bold text-[var(--title)]"
        >
          <span
            data-testid={childTid(primerRoot, "title", "icon")}
            aria-hidden="true"
            className="me-1"
          >
            💡
          </span>
          לִפְנֵי שֶׁמַּתְחִילִים
        </h2>
        <TapToPlayTtsButton
          text={speakText}
          chunks={speakChunks}
          dataTestId={testIds.screen.dayOverview.teachingPrimerTts(g, dayId)}
          ariaLabel="הַשְׁמַע הַסְבָּר קָצָר"
          ariaLabelSpeaking="עֲצוֹר הַשְׁמָעָה"
        />
      </div>
      <div
        data-testid={childTid(primerRoot, "body")}
        className="mt-3 space-y-3 text-[13.5px] leading-relaxed text-[#6f6685]"
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
