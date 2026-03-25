"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { logEvent } from "@/lib/analytics/events";
import {
  COMPLETION_GATE_NOTE,
  LEARNING_ROUTINE_STEPS,
  MINISTRY_STRANDS,
  PARENT_GUIDE,
  TOTAL_CURRICULUM_DAYS,
  dayIdFromNumber,
  fractionOfDaysComplete,
  fractionOverallComplete,
  isStrandComplete,
} from "@/lib/content/curriculum-plan";
import { workbookDays, workbookDaysById } from "@/lib/content/days";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import { routes } from "@/lib/routes";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import type { WorkbookProgressState } from "@/lib/types";

export function PlanScreen({ grade }: { grade: GradeId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;

  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setProgress(loadProgressState({ grade: effectiveGrade }));
    setPreviewAll(getPreviewAllFromLocation());
    logEvent("plan_viewed", { payload: { grade: effectiveGrade } });
    setIsHydrated(true);
  }, [effectiveGrade]);

  const overallPct = useMemo(
    () => Math.round(fractionOverallComplete(progress, TOTAL_CURRICULUM_DAYS) * 100),
    [progress],
  );

  const dayTitle = (n: number) => workbookDaysById[dayIdFromNumber(n)]?.title ?? `יוֹם ${n}`;

  if (!isHydrated) {
    return (
      <main className="pb-10">
        <div className="surface p-6 text-center text-lg font-semibold text-slate-600">טוֹעֲנִים...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl pb-12 px-3 sm:px-4" dir="rtl">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-l from-violet-200 to-sky-100 p-6 shadow-md">
        <span className="pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" aria-hidden>
          📋
        </span>
        <span className="pointer-events-none absolute -bottom-3 left-8 text-6xl opacity-15 select-none" aria-hidden>
          📚
        </span>
        <span className="pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" aria-hidden>
          🎯
        </span>

        <div className="relative space-y-3">
          <nav aria-label="ניווט מהיר" className="flex flex-wrap items-center gap-4">
            <Link
              href={routes.gradeHome(effectiveGrade, { previewAll })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              חֲזָרָה לַחוֹבֶרֶת
            </Link>
            <Link
              href={routes.gradePicker({ previewAll })}
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              חזרה לבחירת כיתה
            </Link>
          </nav>
          <h1 className="text-3xl font-bold leading-tight text-violet-900 sm:text-4xl">
            תּוֹכְנִית לִמּוּדִים לְפִי מִשְׁרַד הַחִינוּךְ
          </h1>
          <p className="text-sm leading-relaxed text-violet-700">
            כָּאן רוֹאִים אֶת הַמַּסְלוּל לְפִי תְחוּמִים, אֶת הַהִתְקַדְּמוּת בְּכָל תְחוּם, וְאֶת הַשִּׁיטָה שֶׁמְחַזֶּקֶת עַצְמָאוּת:
            קְרִיאָה — תִכְנוּן — מַעֲשֶׂה — בְּדִיקָה.
          </p>
        </div>
      </header>

      <section
        className="surface mb-8 border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm"
        aria-labelledby="overall-heading"
      >
        <h2 id="overall-heading" className="mb-3 text-lg font-bold text-slate-800">
          הַהִתְקַדְּמוּת בְּכָל הַחוֹבֶרֶת
        </h2>
        <p className="muted mb-4 text-sm leading-relaxed">
          {TOTAL_CURRICULUM_DAYS} יְמוֹת לִמּוּד — כָּל יוֹם בְּנוּי מִקְטָעִים שֶׁמְחַזְּקִים חִשּׁוּב, שָׂפָה וּבְדִיקַת עַצְמִי.
        </p>
        <div className="mb-2 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600">יָמִים שֶׁהוּשְׁלְמוּ</span>
          <span className={`font-bold ${overallPct === 100 ? "text-emerald-600" : "text-violet-600"}`}>
            {overallPct}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200/90">
          <div
            className={`h-full rounded-full transition-all ${overallPct === 100 ? "bg-emerald-400" : "bg-violet-400"}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="muted mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs leading-relaxed">
          {COMPLETION_GATE_NOTE}
        </p>
      </section>

      <section className="mb-8 space-y-4" aria-labelledby="strands-heading">
        <h2 id="strands-heading" className="text-lg font-bold text-slate-800">
          יְסוֹדוֹת הַלִּמּוּד לְפִי תְחוּמִים
        </h2>
        {MINISTRY_STRANDS.map((strand) => {
          const frac = fractionOfDaysComplete(strand.dayNumbers, progress);
          const pct = Math.round(frac * 100);
          const complete = isStrandComplete(strand.dayNumbers, progress);

          return (
            <article
              key={strand.id}
              className={`surface p-5 shadow-sm transition-shadow ${complete ? "surface-success ring-1 ring-emerald-200/60" : ""}`}
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base font-bold text-violet-900">{strand.title}</h3>
                {complete ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    הוּשְׁלַם
                  </span>
                ) : null}
              </div>
              <p className="muted mb-4 text-sm leading-relaxed">{strand.summary}</p>

              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">הִתְקַדְּמוּת בַּתְחוּם</span>
                  <span className={`font-bold ${complete ? "text-emerald-600" : "text-violet-500"}`}>{pct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${complete ? "bg-emerald-400" : "bg-violet-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <ul className="flex flex-wrap gap-2" aria-label={`קישורים לימים ב${strand.title}`}>
                {strand.dayNumbers.map((n) => {
                  const done = progress.days[dayIdFromNumber(n)]?.isComplete;
                  const dayId = dayIdFromNumber(n);
                  return (
                    <li key={n}>
                      <Link
                        className={`inline-flex min-h-10 min-w-10 flex-col items-center justify-center rounded-2xl px-3 py-2 text-center text-sm font-bold transition-colors ${
                          done
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 hover:bg-emerald-200"
                            : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        }`}
                        href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
                        title={dayTitle(n)}
                      >
                        <span className="leading-none">{n}</span>
                        <span className="mt-0.5 max-w-[7rem] truncate text-[10px] font-normal opacity-80 sm:max-w-[9rem]">
                          {dayTitle(n)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="surface mb-8 p-5 shadow-sm" aria-labelledby="routine-heading">
        <h2 id="routine-heading" className="mb-4 text-lg font-bold text-slate-800">
          רוּטִינַת עֲבוֹדָה יוֹמִית (לְכָל יוֹם בַּחוֹבֶרֶת)
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-sm leading-relaxed text-slate-700">
          {LEARNING_ROUTINE_STEPS.map((step, i) => (
            <li key={i} className="marker:font-bold marker:text-violet-600">
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="surface mb-8 p-5 shadow-sm" aria-labelledby="parents-heading">
        <h2 id="parents-heading" className="mb-4 text-lg font-bold text-slate-800">
          {PARENT_GUIDE.title}
        </h2>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-violet-800">לִפְנֵי</dt>
            <dd className="muted mt-1 leading-relaxed">{PARENT_GUIDE.before}</dd>
          </div>
          <div>
            <dt className="font-semibold text-violet-800">אַחֲרֵי</dt>
            <dd className="muted mt-1 leading-relaxed">{PARENT_GUIDE.after}</dd>
          </div>
          <div>
            <dt className="font-semibold text-violet-800">מַגָּע וּכְּלִים</dt>
            <dd className="muted mt-1 leading-relaxed">{PARENT_GUIDE.tactile}</dd>
          </div>
          <div>
            <dt className="font-semibold text-violet-800">גִּישָּׁה</dt>
            <dd className="muted mt-1 leading-relaxed">{PARENT_GUIDE.mindset}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <Link
          className="touch-button btn-accent block w-full text-center sm:w-auto"
          href={routes.gradeHome(effectiveGrade, { previewAll })}
        >
          חֲזָרָה לְרַשִׁימַת הַיָּמִים
        </Link>
        <span className="hidden text-center text-xs text-slate-400 sm:inline sm:self-center">
          {workbookDays.length} יְמוֹת · כִּיתָּה {gradeLabel(effectiveGrade)}
        </span>
      </div>
    </main>
  );
}

