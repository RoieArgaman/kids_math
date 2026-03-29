"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { logEvent } from "@/lib/analytics/events";
import {
  COMPLETION_GATE_NOTE,
  LEARNING_ROUTINE_STEPS,
  PARENT_GUIDE,
  getMinistryStrandsForGrade,
  getTotalCurriculumDaysForGrade,
  dayIdFromNumber,
  fractionOfDaysComplete,
  fractionOverallComplete,
  isStrandComplete,
} from "@/lib/content/curriculum-plan";
import { getWorkbookDays, getWorkbookDaysById } from "@/lib/content/workbook";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { loadPlanScreenResumeState } from "@/lib/client/loadGradeScreenState";
import { createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { useReloadOnStorageResume } from "@/lib/hooks/useReloadOnStorageResume";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { WorkbookProgressState } from "@/lib/types";

export function PlanScreen({ grade }: { grade: GradeId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  const workbookDaysList = getWorkbookDays(effectiveGrade);
  const workbookDaysById = getWorkbookDaysById(effectiveGrade);
  const ministryStrands = useMemo(() => getMinistryStrandsForGrade(effectiveGrade), [effectiveGrade]);
  const totalCurriculumDays = useMemo(
    () => getTotalCurriculumDaysForGrade(effectiveGrade),
    [effectiveGrade],
  );

  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const reloadResumeBundle = useCallback(() => {
    const bundle = loadPlanScreenResumeState(effectiveGrade);
    setProgress(bundle.progress);
    setPreviewAll(bundle.previewAll);
  }, [effectiveGrade]);

  useReloadOnStorageResume(effectiveGrade, reloadResumeBundle);

  useEffect(() => {
    const bundle = loadPlanScreenResumeState(effectiveGrade);
    setProgress(bundle.progress);
    setPreviewAll(bundle.previewAll);
    logEvent("plan_viewed", { payload: { grade: effectiveGrade } });
    setIsHydrated(true);
  }, [effectiveGrade]);

  const overallPct = useMemo(
    () => Math.round(fractionOverallComplete(progress, totalCurriculumDays) * 100),
    [progress, totalCurriculumDays],
  );

  const dayTitle = (n: number) => workbookDaysById[dayIdFromNumber(n)]?.title ?? `יוֹם ${n}`;

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.plan.root(`${effectiveGrade}.loading`)} className="pb-10">
        <Surface data-testid={childTid(testIds.screen.plan.root(`${effectiveGrade}.loading`), "loading")} className="p-6 text-center text-lg font-semibold text-slate-600">
          טוֹעֲנִים...
        </Surface>
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.plan.root(effectiveGrade)} className="mx-auto max-w-2xl pb-12 px-3 sm:px-4" dir="rtl">
      <HeroHeader
        data-testid={testIds.screen.plan.hero(effectiveGrade)}
        decorations={[
          { emoji: "📋", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "📚", className: "pointer-events-none absolute -bottom-3 left-8 text-6xl opacity-15 select-none" },
          { emoji: "🎯", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
        title="תּוֹכְנִית לִמּוּדִים לְפִי מִשְׁרַד הַחִינוּךְ"
        subtitle={
          <>
            כָּאן רוֹאִים אֶת הַמַּסְלוּל לְפִי תְחוּמִים, אֶת הַהִתְקַדְּמוּת בְּכָל תְחוּם, וְאֶת הַשִּׁיטָה שֶׁמְחַזֶּקֶת עַצְמָאוּת:
            קְרִיאָה — תִכְנוּן — מַעֲשֶׂה — בְּדִיקָה.
          </>
        }
        actions={
          <nav
            data-testid={childTid(testIds.screen.plan.hero(effectiveGrade), "quickNav")}
            aria-label="ניווט מהיר"
            className="flex flex-wrap items-center gap-4"
          >
            <AppNavLink href={routes.gradeHome(effectiveGrade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
            <AppNavLink href={routes.gradePicker({ previewAll })}>חזרה לבחירת כיתה</AppNavLink>
          </nav>
        }
      />

      <section data-testid={testIds.screen.plan.overall()}
        className="surface mb-8 border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm"
        aria-labelledby="overall-heading"
      >
        <h2 data-testid="km.autogen.planscreen.node.idx.12" id="overall-heading" className="mb-3 text-lg font-bold text-slate-800">
          הַהִתְקַדְּמוּת בְּכָל הַחוֹבֶרֶת
        </h2>
        <p data-testid="km.autogen.planscreen.node.idx.13" className="muted mb-4 text-sm leading-relaxed">
          {totalCurriculumDays} יְמוֹת לִמּוּד — כָּל יוֹם בְּנוּי מִקְטָעִים שֶׁמְחַזְּקִים חִשּׁוּב, שָׂפָה וּבְדִיקַת עַצְמִי.
        </p>
        <div data-testid="km.autogen.planscreen.node.idx.14" className="mb-2 flex items-center justify-between text-xs font-medium">
          <span data-testid="km.autogen.planscreen.node.idx.15" className="text-slate-600">יָמִים שֶׁהוּשְׁלְמוּ</span>
          <span data-testid="km.autogen.planscreen.node.idx.16" className={`font-bold ${overallPct === 100 ? "text-emerald-600" : "text-violet-600"}`}>
            {overallPct}%
          </span>
        </div>
        <div data-testid="km.autogen.planscreen.node.idx.17" className="h-3 w-full overflow-hidden rounded-full bg-slate-200/90">
          <div data-testid="km.autogen.planscreen.node.idx.18"
            className={`h-full rounded-full transition-all ${overallPct === 100 ? "bg-emerald-400" : "bg-violet-400"}`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p data-testid="km.autogen.planscreen.node.idx.19" className="muted mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs leading-relaxed">
          {COMPLETION_GATE_NOTE}
        </p>
      </section>

      <section data-testid="km.autogen.planscreen.node.idx.20" className="mb-8 space-y-4" aria-labelledby="strands-heading">
        <h2 data-testid="km.autogen.planscreen.node.idx.21" id="strands-heading" className="text-lg font-bold text-slate-800">
          יְסוֹדוֹת הַלִּמּוּד לְפִי תְחוּמִים
        </h2>
        {ministryStrands.map((strand) => {
          const frac = fractionOfDaysComplete(strand.dayNumbers, progress);
          const pct = Math.round(frac * 100);
          const complete = isStrandComplete(strand.dayNumbers, progress);

          return (
            <article data-testid="km.autogen.planscreen.node.idx.22"
              key={strand.id}
              className={`surface p-5 shadow-sm transition-shadow ${complete ? "surface-success ring-1 ring-emerald-200/60" : ""}`}
            >
              <div data-testid="km.autogen.planscreen.node.idx.23" className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <h3 data-testid="km.autogen.planscreen.node.idx.24" className="text-base font-bold text-violet-900">{strand.title}</h3>
                {complete ? (
                  <span data-testid="km.autogen.planscreen.node.idx.25" className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    הוּשְׁלַם
                  </span>
                ) : null}
              </div>
              <p data-testid="km.autogen.planscreen.node.idx.26" className="muted mb-4 text-sm leading-relaxed">{strand.summary}</p>

              <div data-testid="km.autogen.planscreen.node.idx.27" className="mb-4">
                <div data-testid="km.autogen.planscreen.node.idx.28" className="mb-1 flex items-center justify-between text-xs font-medium">
                  <span data-testid="km.autogen.planscreen.node.idx.29" className="text-slate-500">הִתְקַדְּמוּת בַּתְחוּם</span>
                  <span data-testid="km.autogen.planscreen.node.idx.30" className={`font-bold ${complete ? "text-emerald-600" : "text-violet-500"}`}>{pct}%</span>
                </div>
                <div data-testid="km.autogen.planscreen.node.idx.31" className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div data-testid="km.autogen.planscreen.node.idx.32"
                    className={`h-full rounded-full transition-all ${complete ? "bg-emerald-400" : "bg-violet-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <ul data-testid="km.autogen.planscreen.node.idx.33" className="flex flex-wrap gap-2" aria-label={`קישורים לימים ב${strand.title}`}>
                {strand.dayNumbers.map((n) => {
                  const done = progress.days[dayIdFromNumber(n)]?.isComplete;
                  const dayId = dayIdFromNumber(n);
                  return (
                    <li data-testid="km.autogen.planscreen.node.idx.34" key={n}>
                      <Link
                        className={`inline-flex min-h-10 min-w-10 flex-col items-center justify-center rounded-2xl px-3 py-2 text-center text-sm font-bold transition-colors ${done
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 hover:bg-emerald-200"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                        href={routes.gradeDay(effectiveGrade, dayId, { previewAll })}
                        title={dayTitle(n)}
                      >
                        <span data-testid="km.autogen.planscreen.node.idx.35" className="leading-none">{n}</span>
                        <span data-testid="km.autogen.planscreen.node.idx.36" className="mt-0.5 max-w-[7rem] truncate text-[10px] font-normal opacity-80 sm:max-w-[9rem]">
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

      <section data-testid="km.autogen.planscreen.node.idx.37" className="surface mb-8 p-5 shadow-sm" aria-labelledby="routine-heading">
        <h2 data-testid="km.autogen.planscreen.node.idx.38" id="routine-heading" className="mb-4 text-lg font-bold text-slate-800">
          רוּטִינַת עֲבוֹדָה יוֹמִית (לְכָל יוֹם בַּחוֹבֶרֶת)
        </h2>
        <ol data-testid="km.autogen.planscreen.node.idx.39" className="list-decimal list-inside space-y-3 text-sm leading-relaxed text-slate-700">
          {LEARNING_ROUTINE_STEPS.map((step, i) => (
            <li data-testid="km.autogen.planscreen.node.idx.40" key={i} className="marker:font-bold marker:text-violet-600">
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section data-testid="km.autogen.planscreen.node.idx.41" className="surface mb-8 p-5 shadow-sm" aria-labelledby="parents-heading">
        <h2 data-testid="km.autogen.planscreen.node.idx.42" id="parents-heading" className="mb-4 text-lg font-bold text-slate-800">
          {PARENT_GUIDE.title}
        </h2>
        <dl data-testid="km.autogen.planscreen.node.idx.43" className="space-y-4 text-sm">
          <div data-testid="km.autogen.planscreen.node.idx.44">
            <dt data-testid="km.autogen.planscreen.node.idx.45" className="font-semibold text-violet-800">לִפְנֵי</dt>
            <dd data-testid="km.autogen.planscreen.node.idx.46" className="muted mt-1 leading-relaxed">{PARENT_GUIDE.before}</dd>
          </div>
          <div data-testid="km.autogen.planscreen.node.idx.47">
            <dt data-testid="km.autogen.planscreen.node.idx.48" className="font-semibold text-violet-800">אַחֲרֵי</dt>
            <dd data-testid="km.autogen.planscreen.node.idx.49" className="muted mt-1 leading-relaxed">{PARENT_GUIDE.after}</dd>
          </div>
          <div data-testid="km.autogen.planscreen.node.idx.50">
            <dt data-testid="km.autogen.planscreen.node.idx.51" className="font-semibold text-violet-800">מַגָּע וּכְּלִים</dt>
            <dd data-testid="km.autogen.planscreen.node.idx.52" className="muted mt-1 leading-relaxed">{PARENT_GUIDE.tactile}</dd>
          </div>
          <div data-testid="km.autogen.planscreen.node.idx.53">
            <dt data-testid="km.autogen.planscreen.node.idx.54" className="font-semibold text-violet-800">גִּישָּׁה</dt>
            <dd data-testid="km.autogen.planscreen.node.idx.55" className="muted mt-1 leading-relaxed">{PARENT_GUIDE.mindset}</dd>
          </div>
        </dl>
      </section>

      <div data-testid="km.autogen.planscreen.node.idx.56" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <Link
          className="touch-button btn-accent block w-full text-center sm:w-auto"
          href={routes.gradeHome(effectiveGrade, { previewAll })}
        >
          חֲזָרָה לְרַשִׁימַת הַיָּמִים
        </Link>
        <span data-testid="km.autogen.planscreen.node.idx.57" className="hidden text-center text-xs text-slate-400 sm:inline sm:self-center">
          {workbookDaysList.length} יְמוֹת · כִּיתָּה {gradeLabel(effectiveGrade)}
        </span>
      </div>
    </main>
  );
}

