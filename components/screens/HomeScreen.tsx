"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { DayCard, type DayCardState } from "@/components/home/DayCard";
import { logEvent } from "@/lib/analytics/events";
import { computeAnalyticsRollups } from "@/lib/analytics/metrics";
import { isAdminUnlocked } from "@/lib/admin/session";
import { getWorkbookDays } from "@/lib/content/workbook";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import type { FinalExamState } from "@/lib/final-exam/types";
import { loadGradeHomeResumeState } from "@/lib/client/loadGradeScreenState";
import { canUnlockNextDay, createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { useReloadOnStorageResume } from "@/lib/hooks/useReloadOnStorageResume";
import { routes } from "@/lib/routes";
import { loadStreakState, saveStreakState } from "@/lib/streak/storage";
import { computeNextStreakState, getTodayDate } from "@/lib/streak/engine";
import type { StreakState } from "@/lib/streak/types";
import type { StreakBadgeId } from "@/lib/streak/types";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { useBadges } from "@/lib/hooks/useBadges";
import { childTid, testIds } from "@/lib/testIds";
import type { AnalyticsEvent, DayId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import type { BadgeId } from "@/lib/badges/types";
import { BADGE_DEFINITIONS_MAP } from "@/lib/badges/definitions";

const BADGE_CATEGORY_ORDER: BadgeId[] = [
  "first-day-done", "halfway-there", "streak-3-days", "streak-5-days", "streak-10-days",
  "week-1-complete", "week-2-complete", "week-3-complete", "week-4-complete",
  "zero-mistakes", "sharp-mind", "flawless-five", "zero-hero",
  "perfect-week", "perfect-two-weeks",
  "speed-runner", "lightning-fast", "speed-trio",
  "comeback-kid", "iron-will", "ten-and-done",
  "early-bird", "weekend-warrior",
  "calendar-streak-3", "calendar-streak-7",
  "strand-numbers", "strand-operations", "strand-geometry", "strand-advanced",
  "exam-high-score", "exam-ace",
  "hundred-answers", "five-hundred-answers",
  "grand-master", "grade-a-graduate", "grade-b-graduate",
];

const WEEK_CONFIG: Record<number, { emoji: string; badgeBg: string; badgeText: string }> = {
  1: { emoji: "🌟", badgeBg: "bg-orange-100", badgeText: "text-orange-700" },
  2: { emoji: "🚀", badgeBg: "bg-purple-100", badgeText: "text-purple-700" },
  3: { emoji: "🌈", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
  4: { emoji: "🎨", badgeBg: "bg-rose-100", badgeText: "text-rose-700" },
  5: { emoji: "🏅", badgeBg: "bg-amber-100", badgeText: "text-amber-800" },
};

function getDayState(
  day: WorkbookDay,
  dayIndex: number,
  progress: WorkbookProgressState,
  days: WorkbookDay[],
): DayCardState {
  const dayProgress = progress.days[day.id];
  if (dayProgress?.isComplete) {
    return "complete";
  }
  if (dayIndex === 0) {
    return "open";
  }

  const previousDay = days[dayIndex - 1];
  const previousProgress = progress.days[previousDay.id];
  return canUnlockNextDay(previousDay, previousProgress) ? "open" : "locked";
}

export function HomeScreen({ grade }: { grade: GradeId }) {
  // Grade B is gated at the route layer; keep a safe fallback.
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  const workbookDaysList = getWorkbookDays(effectiveGrade);

  const [progress, setProgress] = useState<WorkbookProgressState>(createInitialWorkbookProgressState);
  const [finalExam, setFinalExam] = useState<FinalExamState | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [streakState, setStreakState] = useState<StreakState | null>(null);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<StreakBadgeId | null>(null);
  const [showTrophy, setShowTrophy] = useState(false);
  const { newlyUnlockedIds, markAllSeen, badgeState, allBadges } = useBadges(effectiveGrade);

  const unlockedBadgeIdSet = new Set(badgeState.unlocked.map((u) => u.id));
  const nextBadge = BADGE_CATEGORY_ORDER
    .map((id) => BADGE_DEFINITIONS_MAP[id])
    .find((def) => def !== undefined && !unlockedBadgeIdSet.has(def.id)) ?? null;

  const handleDismissBadge = useCallback(() => setNewlyEarnedBadge(null), []);

  const reloadResumeBundle = useCallback(() => {
    const bundle = loadGradeHomeResumeState(effectiveGrade);
    setProgress(bundle.progress);
    setFinalExam(bundle.finalExam);
    setEvents(bundle.events);
    setPreviewAll(bundle.previewAll);
  }, [effectiveGrade]);

  useReloadOnStorageResume(effectiveGrade, reloadResumeBundle);

  useEffect(() => {
    const bundle = loadGradeHomeResumeState(effectiveGrade);
    setPreviewAll(bundle.previewAll);
    logEvent("home_viewed", { subject: "math", gradeId: effectiveGrade, payload: { grade: effectiveGrade } });
    setProgress(bundle.progress);
    setFinalExam(bundle.finalExam);
    setEvents(bundle.events);

    // Streak — global, not grade-specific
    const loaded = loadStreakState();
    const { nextState, newlyEarnedBadges } = computeNextStreakState(loaded, getTodayDate());
    if (nextState !== loaded) {
      saveStreakState(nextState);
      logEvent("streak_updated", { payload: { currentStreak: nextState.currentStreak } });
    }
    if (newlyEarnedBadges.length > 0) {
      setNewlyEarnedBadge(newlyEarnedBadges[0]);
      logEvent("badge_earned", { payload: { badgeId: newlyEarnedBadges[0] } });
    }
    setStreakState(nextState);

    setIsHydrated(true);
  }, [effectiveGrade]);

  useEffect(() => {
    if (isHydrated && newlyUnlockedIds.length > 0) {
      setShowTrophy(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  const weeks = useMemo(
    () =>
      workbookDaysList.reduce<Record<number, WorkbookDay[]>>((acc, day) => {
        acc[day.week] = [...(acc[day.week] ?? []), day];
        return acc;
      }, {}),
    [workbookDaysList],
  );

  const isAdmin = isHydrated && isAdminUnlocked();
  const rollups = useMemo(() => computeAnalyticsRollups(events), [events]);

  // Derived per-day state (behavior-preserving): same expression used in the grid below,
  // computed once so we can both render cards and count completes for the overall row.
  const dayStateById = new Map<string, DayCardState>(
    workbookDaysList.map((day) => {
      const idx = workbookDaysList.findIndex((item) => item.id === day.id);
      const isFinalExamDay = day.id === FINAL_EXAM_DAY_ID;
      const finalExamPassed = Boolean(finalExam?.passed);
      const state: DayCardState = isFinalExamDay
        ? finalExamPassed
          ? "complete"
          : previewAll
            ? "open"
            : idx === 0
              ? "open"
              : (() => {
                const previousDay = workbookDaysList[idx - 1];
                const previousProgress = progress.days[previousDay.id];
                return canUnlockNextDay(previousDay, previousProgress) ? "open" : "locked";
              })()
        : previewAll
          ? progress.days[day.id as DayId]?.isComplete
            ? "complete"
            : "open"
          : getDayState(day, idx, progress, workbookDaysList);
      return [day.id, state];
    }),
  );
  const totalDays = workbookDaysList.length;
  const completedDays = workbookDaysList.filter((day) => dayStateById.get(day.id) === "complete").length;
  const overallPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
  const allComplete = totalDays > 0 && completedDays === totalDays;

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.home.root(`${effectiveGrade}.loading`)} className="pb-10">
        <Surface data-testid={childTid(testIds.screen.home.root(`${effectiveGrade}.loading`), "loading")} className="p-6 text-center text-lg font-semibold text-slate-600">
          טוֹעֲנִים...
        </Surface>
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.home.root(effectiveGrade)} className="pb-10">
      <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "topNav")} className="mb-4">
        <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "topNav", "actions")} className="flex items-center gap-4">
          <AppNavLink href={routes.subjectsForGrade(effectiveGrade, { previewAll })}>חזרה לבחירת נושא</AppNavLink>
          <AppNavLink
            href={routes.gradeBadges(effectiveGrade, { previewAll })}
            data-testid={testIds.screen.badges.badgesCta(effectiveGrade)}
            onClick={() => logEvent("badges_viewed", { payload: { grade: effectiveGrade, unlockedCount: badgeState.unlocked.length } })}
          >
            🏆 הַפְּרָסִים שֶׁלִּי ({badgeState.unlocked.length}/{allBadges.length})
          </AppNavLink>
        </div>
      </div>

      <HeroHeader
        data-testid={testIds.screen.home.hero(effectiveGrade)}
        title={
          <span
            data-testid={childTid(testIds.screen.home.hero(effectiveGrade), "title", "row")}
            className="inline-flex items-center justify-center gap-3"
          >
            <span
              data-testid={childTid(testIds.screen.home.hero(effectiveGrade), "title", "emoji")}
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-3xl shadow-[0_4px_14px_rgba(124,111,205,0.18)]"
              style={{ unicodeBidi: "isolate" }}
            >
              🧮
            </span>
            <span data-testid={childTid(testIds.screen.home.hero(effectiveGrade), "title", "text")}>
              חוֹבֶרֶת מָתֵמָטִיקָה
            </span>
          </span>
        }
        subtitle={`מַסְלוּל יוֹמִי לִשְׁבוּעַיִם, עִם פְּתִיחָה הַדְרָגָתִית לְפִי הִתְקַדְּמוּת. · כִּיתָּה ${gradeLabel(effectiveGrade)}`}
        decorations={[
          { emoji: "✨", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "⭐", className: "pointer-events-none absolute -bottom-3 left-8 text-6xl opacity-15 select-none" },
          { emoji: "🔢", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
          { emoji: "➕", className: "pointer-events-none absolute bottom-1 right-16 text-4xl opacity-10 select-none" },
        ]}
        actions={
          <Link
            data-testid={testIds.screen.home.planCta(effectiveGrade)}
            className="touch-button btn-accent inline-block w-full text-center text-base font-semibold shadow-sm sm:w-auto"
            href={routes.gradePlan(effectiveGrade, { previewAll })}
          >
            תּוֹכְנִית לִמּוּדִים לְפִי מִשְׁרַד הַחִינוּךְ
          </Link>
        }
      />

      <div
        data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall")}
        className="mb-5"
      >
        <div
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall", "head")}
          className="mb-1.5 flex items-center justify-between text-sm font-bold"
        >
          <span
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall", "label")}
            className="text-[--title]"
          >
            הִתְקַדְּמוּת כְּלָלִית
          </span>
          <span
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall", "count")}
            className="text-[--muted]"
          >
            {completedDays} / {totalDays} יָמִים
          </span>
        </div>
        <div
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall", "track")}
          className="h-2 w-full overflow-hidden rounded-full bg-[--track]"
        >
          <div
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "overall", "fill")}
            className={`h-full rounded-full transition-all ${allComplete ? "bg-[#34d399]" : "bg-[--accent]"}`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {streakState !== null && (
        <div
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "streakRow")}
          className="mb-4 flex justify-start"
        >
          <StreakBadge
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "streakBadge")}
            currentStreak={streakState.currentStreak}
            newlyEarnedBadge={newlyEarnedBadge}
            onDismissBadge={handleDismissBadge}
          />
        </div>
      )}

      {finalExam?.passed ? (
        <div
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "gmatBanner")}
          className="surface mb-6 rounded-3xl p-4"
        >
          <p data-testid={childTid(testIds.screen.home.root(effectiveGrade), "gmatBanner", "text")} className="text-sm font-semibold text-slate-800">רוצים עוד אתגר מתמטי (רשות)?</p>
          <Link
            data-testid={testIds.screen.home.gmatChallengeCta(effectiveGrade)}
            className="touch-button btn-accent mt-3 inline-block w-full text-center text-sm font-semibold sm:w-auto"
            href={routes.gradeGmatChallenge(effectiveGrade, { previewAll })}
          >
            אתגר התנסות — בסגנון GMAT Focus
          </Link>
        </div>
      ) : null}

      {nextBadge && !showTrophy && (
        <div
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge")}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
          dir="rtl"
        >
          <span data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge", "icon")} className="text-3xl">{nextBadge.icon}</span>
          <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge", "body")} className="min-w-0 flex-1">
            <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge", "label")} className="text-xs font-semibold text-amber-700">הפרס הבא שאפשר להשיג:</div>
            <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge", "name")} className="truncate text-sm font-bold text-amber-900">{nextBadge.name}</div>
            <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "nextBadge", "description")} className="truncate text-xs text-amber-700">{nextBadge.description}</div>
          </div>
          <Link
            href={routes.gradeBadges(effectiveGrade)}
            className="shrink-0 text-xs font-semibold text-violet-600 hover:underline"
          >
            כל הפרסים ←
          </Link>
        </div>
      )}

      {Object.entries(weeks).map(([week, weekDays]) => {
        const weekNum = Number(week);
        const weekCfg =
          WEEK_CONFIG[weekNum] ?? { emoji: "📚", badgeBg: "bg-slate-100", badgeText: "text-slate-700" };

        return (
          <section data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week)} key={week} className="mb-8">
            {/* Week divider */}
            <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "banner")} className="mb-4 flex items-center gap-3">
              <span
                data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "badge")}
                className="shrink-0 text-sm font-bold text-[#8b8696]"
              >
                {weekCfg.emoji} שָׁבוּעַ {week}
              </span>
              <div
                data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "rule")}
                className="h-px flex-1 bg-[--hairline]"
              />
            </div>

            <div
              data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "grid")}
              className="grid gap-4"
            >
              {weekDays.map((day) => {
                const isFinalExamDay = day.id === FINAL_EXAM_DAY_ID;
                const dayProgress = progress.days[day.id as DayId];

                const state: DayCardState = dayStateById.get(day.id) ?? "locked";

                const score = isFinalExamDay ? 0 : (dayProgress?.percentDone ?? 0);

                return (
                  <DayCard
                    key={day.id}
                    day={day}
                    state={state}
                    score={score}
                    effectiveGrade={effectiveGrade}
                    previewAll={previewAll}
                    dayProgress={dayProgress}
                    isFinalExamDay={isFinalExamDay}
                    finalExam={finalExam}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <TrophyUnlock
        visible={showTrophy}
        newBadgeIds={newlyUnlockedIds}
        onConfirm={() => {
          markAllSeen();
          setShowTrophy(false);
        }}
      />

      {/* QA section — visible to admins only */}
      {isAdmin && (
        <details
          data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel")}
          className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70"
        >
          <summary
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel", "summary")}
            className="cursor-pointer text-sm font-semibold text-slate-500"
          >
            🛠 מַדְּדֵי QA מְקוֹמִיִּים
          </summary>
          <p
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel", "metrics")}
            className="muted mt-2 text-xs"
          >
            חֲסִימוֹת שַׁעַר: {rollups.gateBlockedCount} | מַעֲבַר שַׁעַר: {rollups.gatePassedCount} | דִּיּוּק נִסָּיוֹן
            רִאשׁוֹן: {Math.round(rollups.firstPassAccuracy * 100)}%
          </p>
          <details
            data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel", "events")}
            className="mt-3"
          >
            <summary
              data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel", "events", "summary")}
              className="cursor-pointer text-xs font-medium text-slate-400"
            >
              תְּצוּגַת אֵירוּעִים (JSON)
            </summary>
            <pre
              data-testid={childTid(testIds.screen.home.root(effectiveGrade), "qaPanel", "events", "pre")}
              className="mt-2 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600"
            >
              {JSON.stringify(events, null, 2) || "[]"}
            </pre>
          </details>
        </details>
      )}
    </main>
  );
}

