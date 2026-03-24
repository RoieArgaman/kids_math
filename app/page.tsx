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
  open: { icon: "▶️", text: "בֹּאוּ נִלְמַד!" },
  complete: { icon: "🏆", text: "הוּשְׁלַם" },
};

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🐬", "🦊", "🐼", "🦄", "🐙", "🦉", "🐳"];

const WEEK_CONFIG: Record<number, { emoji: string; badgeBg: string; badgeText: string }> = {
  1: { emoji: "🌟", badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  2: { emoji: "🚀", badgeBg: "bg-purple-100", badgeText: "text-purple-700" },
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
    <main className="pb-10">
      {/* Hero header */}
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-violet-200 to-sky-100 p-6 shadow-md border border-violet-200">
        {/* Decorative background elements */}
        <span className="pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none">✨</span>
        <span className="pointer-events-none absolute -bottom-3 left-8 text-6xl opacity-15 select-none">⭐</span>
        <span className="pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none">🔢</span>
        <span className="pointer-events-none absolute bottom-1 right-16 text-4xl opacity-10 select-none">➕</span>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-violet-900">
            <span aria-hidden="true" style={{ unicodeBidi: "isolate" }}>🧮 </span>חוֹבֶרֶת מָתֵמָטִיקָה - כִּיתָּה א&apos;
          </h1>
          <p className="mt-2 text-sm text-violet-600">
            מַסְלוּל יוֹמִי לִשְׁבוּעַיִם, עִם פְּתִיחָה הַדְרָגָתִית לְפִי הִתְקַדְּמוּת.
          </p>
        </div>
      </header>

      {Object.entries(weeks).map(([week, weekDays]) => {
        const weekNum = Number(week);
        const weekCfg = WEEK_CONFIG[weekNum] ?? { emoji: "📚", badgeBg: "bg-slate-100", badgeText: "text-slate-700" };

        return (
          <section key={week} className="mb-8">
            {/* Week banner */}
            <div className="mb-4 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-base font-bold ${weekCfg.badgeBg} ${weekCfg.badgeText}`}>
                {weekCfg.emoji} שָׁבוּעַ {week}
              </span>
            </div>

            <div className="grid gap-4">
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
                const dayEmoji = DAY_EMOJIS[(day.dayNumber - 1) % DAY_EMOJIS.length];

                const stateChipClasses =
                  state === "locked"
                    ? "bg-red-100 text-red-600"
                    : state === "complete"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700";

                const cardBorderClasses =
                  state === "open"
                    ? "border-r-4 border-r-violet-400"
                    : state === "complete"
                      ? "border-r-4 border-r-emerald-400"
                      : "";

                return (
                  <article
                    key={day.id}
                    className={`surface relative p-5 ${state === "complete" ? "surface-success" : ""} ${cardBorderClasses} ${state === "locked" ? "opacity-60" : ""}`}
                  >
                    {/* Complete badge */}
                    {state === "complete" && (
                      <span className="absolute left-4 top-4 text-2xl" aria-hidden="true">✅</span>
                    )}

                    {/* Card header row */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Day number circle */}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                          {day.dayNumber}
                        </span>
                        <strong className="text-base">
                          {dayEmoji} יוֹם {day.dayNumber}: {day.title}
                        </strong>
                      </div>

                      {/* State chip */}
                      <span
                        aria-label={stateUi.text}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stateChipClasses}`}
                      >
                        {stateUi.icon} {stateUi.text}
                      </span>
                    </div>

                    <p className="muted mb-3 text-sm">{day.objective}</p>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-500">הִתְקַדְּמוּת</span>
                        <span className={`font-bold ${score === 100 ? "text-emerald-600" : "text-violet-500"}`}>
                          {Math.round(score)}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${score === 100 ? "bg-emerald-400" : "bg-violet-400"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    {state === "locked" ? (
                      <p className="muted text-center text-sm">סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ 🔒</p>
                    ) : (
                      <Link
                        className="touch-button btn-accent block w-full text-center sm:w-auto"
                        href={previewAll ? `/day/${day.id}?previewAll=1` : `/day/${day.id}`}
                        onClick={() => logEvent("day_card_clicked", { dayId: day.id })}
                      >
                        כְּנִיסָה לַיּוֹם
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* QA section */}
      <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70">
        <summary className="cursor-pointer text-sm font-semibold text-slate-500">
          🛠 מַדְּדֵי QA מְקוֹמִיִּים
        </summary>
        <p className="muted mt-2 text-xs">
          חֲסִימוֹת שַׁעַר: {rollups.gateBlockedCount} | מַעֲבַר שַׁעַר: {rollups.gatePassedCount} | דִּיּוּק נִסָּיוֹן
          רִאשׁוֹן: {Math.round(rollups.firstPassAccuracy * 100)}%
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-400">תְּצוּגַת אֵירוּעִים (JSON)</summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600">
            {eventsJson || "[]"}
          </pre>
        </details>
      </details>
    </main>
  );
}
