"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { Chip } from "@/components/ui/Chip";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { logEvent, loadEvents } from "@/lib/analytics/events";
import { computeAnalyticsRollups } from "@/lib/analytics/metrics";
import { getWorkbookDays } from "@/lib/content/workbook";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { FINAL_EXAM_DAY_ID, FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import type { FinalExamState } from "@/lib/final-exam/types";
import { canUnlockNextDay, createInitialWorkbookProgressState } from "@/lib/progress/engine";
import { loadProgressState } from "@/lib/progress/storage";
import { routes } from "@/lib/routes";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import { loadStreakState, saveStreakState } from "@/lib/streak/storage";
import { computeNextStreakState, getTodayDate } from "@/lib/streak/engine";
import type { StreakState } from "@/lib/streak/types";
import type { StreakBadgeId } from "@/lib/streak/types";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { normalizeAnswerValue } from "@/lib/utils/exercise";
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

type DayCardState = "locked" | "open" | "complete";

const STATE_COPY: Record<DayCardState, { icon: string; text: string }> = {
  locked: { icon: "🔒", text: "נָעוּל" },
  open: { icon: "▶️", text: "בֹּאוּ נִלְמַד!" },
  complete: { icon: "🏆", text: "הוּשְׁלַם" },
};

function percentForFinalExamHomeCard(finalExam: FinalExamState | null): number {
  if (!finalExam) return 0;
  if (finalExam.submittedAt && typeof finalExam.scorePercent === "number") {
    return finalExam.scorePercent;
  }
  const ids = finalExam.selectedExerciseIds;
  if (!ids.length) return 0;
  const answered = ids.filter((id) => normalizeAnswerValue(finalExam.answers[id] ?? "") !== null).length;
  return Math.round((answered / FINAL_EXAM_QUESTION_COUNT) * 100);
}

const DAY_EMOJIS = ["🦁", "🐸", "🦋", "🐬", "🦊", "🐼", "🦄", "🐙", "🦉", "🐳"];

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
  const [finalExam, setFinalExam] = useState<ReturnType<typeof loadFinalExamState>>(null);
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

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    logEvent("home_viewed", { payload: { grade: effectiveGrade } });
    setProgress(loadProgressState({ grade: effectiveGrade }));
    setFinalExam(loadFinalExamState(effectiveGrade));
    setEvents(loadEvents());

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

  const rollups = useMemo(() => computeAnalyticsRollups(events), [events]);
  const eventsJson = useMemo(() => JSON.stringify(events, null, 2), [events]);

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
          <AppNavLink href={routes.gradePicker({ previewAll })}>חזרה לבחירת כיתה</AppNavLink>
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
          <>
            <span
              data-testid={childTid(testIds.screen.home.hero(effectiveGrade), "title", "emoji")}
              aria-hidden="true"
              style={{ unicodeBidi: "isolate" }}
            >
              🧮{" "}
            </span>
            חוֹבֶרֶת מָתֵמָטִיקָה - כִּיתָּה {gradeLabel(effectiveGrade)}
          </>
        }
        subtitle="מַסְלוּל יוֹמִי לִשְׁבוּעַיִם, עִם פְּתִיחָה הַדְרָגָתִית לְפִי הִתְקַדְּמוּת."
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
            {/* Week banner */}
            <div data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "banner")} className="mb-4 flex items-center gap-2">
              <Chip
                data-testid={childTid(testIds.screen.home.root(effectiveGrade), "week", week, "badge")}
                tone="neutral"
                className={`gap-1.5 px-4 py-1.5 text-base font-bold ${weekCfg.badgeBg} ${weekCfg.badgeText}`}
              >
                {weekCfg.emoji} שָׁבוּעַ {week}
              </Chip>
            </div>

            <div data-testid="km.autogen.homescreen.node.idx.16" className="grid gap-4">
              {weekDays.map((day) => {
                const idx = workbookDaysList.findIndex((item) => item.id === day.id);
                const isFinalExamDay = day.id === FINAL_EXAM_DAY_ID;
                const dayProgress = progress.days[day.id as DayId];
                // Use final-exam submission only — workbook day-29 can be marked complete without `passed`.
                const finalExamPassed = Boolean(finalExam?.passed);

                const state = isFinalExamDay
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
                const stateUi = STATE_COPY[state];
                const score = isFinalExamDay
                  ? percentForFinalExamHomeCard(finalExam)
                  : (dayProgress?.percentDone ?? 0);
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
                  <article data-testid="km.autogen.homescreen.node.idx.17"
                    key={day.id}
                    className={`surface relative overflow-hidden p-5 ${state === "complete" ? "surface-success" : ""} ${cardBorderClasses} ${state === "locked" ? "opacity-60" : ""}`}
                  >
                    {/* Card header row */}
                    <div data-testid="km.autogen.homescreen.node.idx.18" className="mb-3 flex items-start justify-between gap-2 sm:gap-3">
                      <div data-testid="km.autogen.homescreen.node.idx.19" className="flex min-w-0 flex-1 items-start gap-2">
                        {/* Day number circle */}
                        <span data-testid="km.autogen.homescreen.node.idx.20" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                          {day.dayNumber}
                        </span>
                        <strong data-testid="km.autogen.homescreen.node.idx.21" className="min-w-0 text-base leading-snug break-words">
                          {dayEmoji} יוֹם {day.dayNumber}: {day.title}
                        </strong>
                      </div>

                      {/* State chip */}
                      <span data-testid="km.autogen.homescreen.node.idx.22"
                        aria-label={stateUi.text}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap sm:px-3 ${stateChipClasses}`}
                      >
                        {stateUi.icon} {stateUi.text}
                      </span>
                    </div>

                    <p data-testid="km.autogen.homescreen.node.idx.23" className="muted mb-3 text-sm">{day.objective}</p>
                    {isFinalExamDay && !finalExamPassed ? (
                      <p
                        data-testid={childTid(testIds.screen.home.dayCard(day.id), "gmatHint")}
                        className="mb-3 text-xs leading-relaxed text-slate-600"
                      >
                        ההתקדמות כאן מציגה את מבחן המסכם בלבד. אתגר GMAT (רשות, עם כללים בנפרד) ייפתח רק אחרי שעוברים את המבחן המסכם.
                      </p>
                    ) : null}

                    {/* Progress bar */}
                    <div data-testid="km.autogen.homescreen.node.idx.24" className="mb-4">
                      <div data-testid="km.autogen.homescreen.node.idx.25" className="mb-1 flex items-center justify-between text-xs font-medium">
                        <span data-testid="km.autogen.homescreen.node.idx.26" className="text-slate-500">הִתְקַדְּמוּת</span>
                        <span data-testid="km.autogen.homescreen.node.idx.27" className={`font-bold ${score === 100 ? "text-emerald-600" : "text-violet-500"}`}>
                          {Math.round(score)}%
                        </span>
                      </div>
                      <div data-testid="km.autogen.homescreen.node.idx.28" className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div data-testid="km.autogen.homescreen.node.idx.29"
                          className={`h-full rounded-full transition-all ${score === 100 ? "bg-emerald-400" : "bg-violet-400"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    {state === "locked" ? (
                      <p data-testid="km.autogen.homescreen.node.idx.30" className="muted text-center text-sm">סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ 🔒</p>
                    ) : (
                      <Link
                        data-testid={testIds.screen.home.dayCardCta(day.id)}
                        className="touch-button btn-accent block w-full text-center sm:w-auto"
                        href={routes.gradeDay(effectiveGrade, day.id, { previewAll })}
                        onClick={() => logEvent("day_card_clicked", { payload: { grade: effectiveGrade, dayId: day.id } })}
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

      <TrophyUnlock
        visible={showTrophy}
        newBadgeIds={newlyUnlockedIds}
        onConfirm={() => {
          markAllSeen();
          setShowTrophy(false);
        }}
      />

      {/* QA section */}
      <details data-testid="km.autogen.homescreen.node.idx.31" className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-70">
        <summary data-testid="km.autogen.homescreen.node.idx.32" className="cursor-pointer text-sm font-semibold text-slate-500">🛠 מַדְּדֵי QA מְקוֹמִיִּים</summary>
        <p data-testid="km.autogen.homescreen.node.idx.33" className="muted mt-2 text-xs">
          חֲסִימוֹת שַׁעַר: {rollups.gateBlockedCount} | מַעֲבַר שַׁעַר: {rollups.gatePassedCount} | דִּיּוּק נִסָּיוֹן
          רִאשׁוֹן: {Math.round(rollups.firstPassAccuracy * 100)}%
        </p>
        <details data-testid="km.autogen.homescreen.node.idx.34" className="mt-3">
          <summary data-testid="km.autogen.homescreen.node.idx.35" className="cursor-pointer text-xs font-medium text-slate-400">תְּצוּגַת אֵירוּעִים (JSON)</summary>
          <pre data-testid="km.autogen.homescreen.node.idx.36" className="mt-2 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-600">
            {eventsJson || "[]"}
          </pre>
        </details>
      </details>
    </main>
  );
}

