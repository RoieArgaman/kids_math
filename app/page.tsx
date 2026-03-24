"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { logEvent, loadEvents } from "@/lib/analytics/events";
import { computeAnalyticsRollups } from "@/lib/analytics/metrics";
import { workbookDays } from "@/lib/content/days";
import { canUnlockNextDay, createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import type { AnalyticsEvent, DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";

type DayCardState = "locked" | "open" | "complete";

const STATE_COPY: Record<DayCardState, { icon: string; text: string }> = {
  locked: { icon: "🔒", text: "נָעוּל" },
  open: { icon: "▶", text: "פָּתוּחַ" },
  complete: { icon: "✓", text: "הוּשְׁלַם" },
};

function getDayState(
  day: WorkbookDay,
  dayIndex: number,
  progress: WorkbookProgressState,
): DayCardState {
  const dayProgress = progress.days[day.id];
  if (dayProgress?.isComplete) {
    return "complete";
  }
  if (dayIndex === 0) {
    return "open";
  }

  const previousDay = workbookDays[dayIndex - 1];
  const previousProgress = progress.days[previousDay.id];
  return canUnlockNextDay(previousDay, previousProgress) ? "open" : "locked";
}

export default function Home() {
  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [previewAll, setPreviewAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPreviewAll(params.get("previewAll") === "1");
    logEvent("home_viewed");
    setProgress(loadProgressState());
    setEvents(loadEvents());
  }, []);

  const weeks = useMemo(
    () =>
      workbookDays.reduce<Record<number, WorkbookDay[]>>((acc, day) => {
        acc[day.week] = [...(acc[day.week] ?? []), day];
        return acc;
      }, {}),
    [],
  );

  const rollups = useMemo(() => computeAnalyticsRollups(events), [events]);
  const eventsJson = useMemo(() => JSON.stringify(events, null, 2), [events]);

  return (
    <main>
      <header className="surface mb-4 p-4">
        <h1 className="text-2xl font-bold">חוֹבֶרֶת מָתֵמָטִיקָה - כִּיתָּה א&apos;</h1>
        <p className="muted mt-2 text-sm">מַסְלוּל יוֹמִי לִשְׁבוּעַיִם, עִם פְּתִיחָה הַדְרָגָתִית לְפִי הִתְקַדְּמוּת.</p>
      </header>

      {Object.entries(weeks).map(([week, weekDays]) => (
        <section key={week} className="mb-5">
          <h2 className="mb-2 text-lg font-semibold">שָׁבוּעַ {week}</h2>
          <div className="grid gap-3">
            {weekDays.map((day) => {
              const idx = workbookDays.findIndex((item) => item.id === day.id);
              const state = previewAll
                ? progress.days[day.id as DayId]?.isComplete
                  ? "complete"
                  : "open"
                : getDayState(day, idx, progress);
              const stateUi = STATE_COPY[state];
              const dayProgress = progress.days[day.id as DayId];
              const score = dayProgress?.percentDone ?? 0;

              return (
                <article key={day.id} className={`surface p-4 ${state === "complete" ? "surface-success" : ""}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <strong>
                      יוֹם {day.dayNumber}: {day.title}
                    </strong>
                    <span aria-label={stateUi.text}>
                      {stateUi.icon} {stateUi.text}
                    </span>
                  </div>
                  <p className="muted text-sm">{day.objective}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm">הִתְקַדְּמוּת: {Math.round(score)}%</span>
                    {state === "locked" ? (
                      <span className="muted text-sm">סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ</span>
                    ) : (
                      <Link
                        className="touch-button btn-accent"
                        href={previewAll ? `/day/${day.id}?previewAll=1` : `/day/${day.id}`}
                        onClick={() => logEvent("day_card_clicked", { dayId: day.id })}
                      >
                        כְּנִיסָה לַיּוֹם
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="surface mt-6 p-4">
        <h2 className="text-base font-semibold">מַדְּדֵי QA מְקוֹמִיִּים</h2>
        <p className="muted mt-1 text-sm">
          חֲסִימוֹת שַׁעַר: {rollups.gateBlockedCount} | מַעֲבַר שַׁעַר: {rollups.gatePassedCount} | דִּיּוּק נִסָּיוֹן
          רִאשׁוֹן: {Math.round(rollups.firstPassAccuracy * 100)}%
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium">תְּצוּגַת אֵירוּעִים (JSON)</summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {eventsJson || "[]"}
          </pre>
        </details>
      </section>
    </main>
  );
}
