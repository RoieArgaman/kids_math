"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { CompletionPanel } from "@/components/ui/CompletionPanel";
import { DayHeader } from "@/components/DayHeader";
import { DayTeachingPrimer } from "@/components/DayTeachingPrimer";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { ProgressHeader } from "@/components/ui/ProgressHeader";
import { StarReward } from "@/components/StarReward";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { getWorkbookDays } from "@/lib/content/workbook";
import { DEFAULT_GRADE, type GradeId } from "@/lib/grades";
import { COMPLETION_GATE_PERCENT } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { useDayUnlockStatus } from "@/lib/hooks/useDayUnlockStatus";
import { useBadges } from "@/lib/hooks/useBadges";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { findSectionForExercise, getWeakExercises } from "@/lib/utils/adaptiveSuggestions";
import type { DayId, ExerciseId, Section } from "@/lib/types";
import type { SectionType } from "@/lib/types/curriculum";

type SectionCardState = "locked" | "open" | "complete";

const SECTION_TYPE_CHIP_CLASS: Record<SectionType, string> = {
  warmup: "bg-amber-100 border-amber-300 text-amber-800",
  arithmetic: "bg-blue-100 border-blue-300 text-blue-800",
  geometry: "bg-purple-100 border-purple-300 text-purple-800",
  verbal: "bg-rose-100 border-rose-300 text-rose-800",
  challenge: "bg-orange-100 border-orange-300 text-orange-800",
  review: "bg-teal-100 border-teal-300 text-teal-800",
};

const SECTION_TYPE_LABEL: Record<SectionType, string> = {
  warmup: "חִימּוּם",
  arithmetic: "חֶשְׁבּוֹן",
  geometry: "גֵּיאוֹמֶטְרִיָּה",
  verbal: "מִילּוּלִי",
  challenge: "אַתְגָּר",
  review: "חֲזָרָה",
};

const SECTION_TYPE_EMOJI: Record<SectionType, string> = {
  warmup: "🌅",
  arithmetic: "🔢",
  geometry: "📐",
  verbal: "📝",
  challenge: "🏆",
  review: "🔁",
};

function getSectionCardState(
  section: Section,
  sectionIdx: number,
  allSections: Section[],
  correctAnswers: Record<ExerciseId, boolean>,
): SectionCardState {
  const isComplete = section.exercises.every((ex) => correctAnswers[ex.id] === true);
  if (isComplete) return "complete";
  if (sectionIdx === 0) return "open";

  // Last section unlocks only when ALL other sections are complete
  if (sectionIdx === allSections.length - 1) {
    const allOthersComplete = allSections
      .slice(0, -1)
      .every((s) => s.exercises.every((ex) => correctAnswers[ex.id] === true));
    return allOthersComplete ? "open" : "locked";
  }

  // Middle sections unlock once warmup is complete
  const warmup = allSections[0];
  const warmupComplete = warmup?.exercises.every((ex) => correctAnswers[ex.id] === true) ?? false;
  return warmupComplete ? "open" : "locked";
}

export function DayOverviewScreen({ grade, dayId }: { grade: GradeId; dayId: DayId }) {
  const effectiveGrade = grade ?? DEFAULT_GRADE;
  const router = useRouter();

  const {
    markComplete,
    percentDone,
    isComplete,
    correctAnswers,
  } = useProgress(dayId, { grade: effectiveGrade });

  const day = useMemo(
    () => getWorkbookDays(effectiveGrade).find((d) => d.id === dayId),
    [dayId, effectiveGrade],
  );

  const { previewAll, isRouteReady, isLocked } = useDayUnlockStatus({ grade: effectiveGrade, dayId });

  const [showReward, setShowReward] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const { newlyUnlockedIds, markAllSeen } = useBadges(effectiveGrade, {
    evaluateTrigger: isComplete,
  });

  const sectionStates = useMemo(() => {
    if (!day) return {} as Record<string, SectionCardState>;
    return Object.fromEntries(
      day.sections.map((section, idx) => [
        section.id,
        getSectionCardState(section, idx, day.sections, correctAnswers),
      ]),
    );
  }, [day, correctAnswers]);

  const sectionCorrectCounts = useMemo(() => {
    if (!day) return {} as Record<string, number>;
    return Object.fromEntries(
      day.sections.map((section) => [
        section.id,
        section.exercises.filter((ex) => correctAnswers[ex.id as ExerciseId] === true).length,
      ]),
    );
  }, [day, correctAnswers]);

  const allSectionsComplete = useMemo(
    () => Boolean(day) && day!.sections.every((s) => sectionStates[s.id] === "complete"),
    [day, sectionStates],
  );

  const weakExercises = useMemo(
    () =>
      isComplete && day
        ? getWeakExercises(day.sections, correctAnswers, 3)
        : [],
    [isComplete, day, correctAnswers],
  );

  const root = testIds.screen.dayOverview.root(effectiveGrade, dayId);

  if (!day) {
    return (
      <main data-testid={testIds.screen.dayOverview.root(effectiveGrade, `${dayId}.not-found`)}>
        <CenteredPanel
          emoji="🔍"
          title="הַיּוֹם לֹא נִמְצָא."
          actions={
            <ButtonLink
              href={routes.gradeHome(effectiveGrade, { previewAll })}
              className="w-full text-center"
            >
              חֲזָרָה לַחוֹבֶרֶת
            </ButtonLink>
          }
        />
      </main>
    );
  }

  if (!isRouteReady || isLocked === null) {
    return (
      <main
        data-testid={testIds.screen.dayOverview.root(effectiveGrade, `${dayId}.loading`)}
        className="flex min-h-screen items-center justify-center"
      >
        <LoadingPanel emoji="⏳" title="טוֹעֲנִים אֶת הַיּוֹם..." />
      </main>
    );
  }

  if (isLocked) {
    return (
      <main data-testid={testIds.screen.dayOverview.root(effectiveGrade, `${dayId}.locked`)}>
        <CenteredPanel
          emoji="🔒"
          title="הַיּוֹם נָעוּל"
          description="צָרִיךְ לְהַשְׁלִים אֶת הַיּוֹם הַקּוֹדֵם בְּ-100% כְּדֵי לִפְתֹּחַ אֶת הַיּוֹם הַזֶּה."
          actions={
            <ButtonLink
              href={routes.gradeHome(effectiveGrade, { previewAll })}
              className="w-full text-center"
            >
              חֲזוֹר הַבַּיְתָה
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const completeDay = () => {
    const passed = markComplete();
    if (!passed) return;
    setShowReward(true);
  };

  return (
    <main data-testid={root}>
      {/* Nav */}
      <div
        data-testid={testIds.screen.dayOverview.nav(effectiveGrade, dayId)}
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
      >
        <AppNavLink href={routes.gradeHome(effectiveGrade, { previewAll })}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
        <AppNavLink href={routes.gradePicker({ previewAll })}>חזרה לבחירת כיתה</AppNavLink>
      </div>

      {/* Progress bar */}
      <ProgressHeader
        data-testid={childTid(root, "progressBar")}
        percentDone={percentDone}
        label={`הַיַּעַד לְהַשְׁלָמָה: ${COMPLETION_GATE_PERCENT}%`}
        className="mb-4"
      />

      {/* Day header */}
      <div data-testid={childTid(root, "header")} className="mb-4">
        <DayHeader
          day={day}
          rootTestId={childTid(root, "dayHeader")}
          showSessionTimer={false}
          sessionTimerMs={null}
          sessionTimerTestId={childTid(root, "dayHeader", "timer")}
        />
      </div>

      <DayTeachingPrimer day={day} grade={effectiveGrade} dayId={dayId} />

      {/* Section cards */}
      <div data-testid={childTid(root, "sections")} className="mb-6 flex flex-col gap-4">
        {day.sections.map((section, idx) => {
          const state = sectionStates[section.id] ?? "locked";
          const isCardLocked = state === "locked";
          const isCardComplete = state === "complete";
          const chipClass =
            SECTION_TYPE_CHIP_CLASS[section.type] ?? "bg-gray-100 border-gray-300 text-gray-800";
          const typeLabel = SECTION_TYPE_LABEL[section.type] ?? section.type;
          const emoji = SECTION_TYPE_EMOJI[section.type] ?? "📚";
          const correctInSection = sectionCorrectCounts[section.id] ?? 0;
          const cardRoot = testIds.screen.dayOverview.sectionCard(effectiveGrade, dayId, section.id);

          return (
            <div
              key={section.id}
              data-testid={cardRoot}
              className={`rounded-3xl border-2 p-5 shadow-sm transition-all ${
                isCardComplete
                  ? "border-emerald-300 bg-emerald-50"
                  : isCardLocked
                    ? "border-gray-200 bg-gray-50 opacity-60"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div data-testid={childTid(cardRoot, "topRow")} className="mb-3 flex items-center gap-3">
                <span data-testid={childTid(cardRoot, "emoji")} className="text-3xl">
                  {isCardComplete ? "✅" : isCardLocked ? "🔒" : emoji}
                </span>
                <div data-testid={childTid(cardRoot, "info")} className="min-w-0 flex-1">
                  <p data-testid={childTid(cardRoot, "title")} className="text-base font-bold leading-tight">
                    {section.title}
                  </p>
                  <p data-testid={childTid(cardRoot, "goal")} className="mt-0.5 text-xs text-gray-500">
                    {section.learningGoal}
                  </p>
                </div>
                <span
                  data-testid={childTid(cardRoot, "chip")}
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${chipClass}`}
                >
                  {typeLabel}
                </span>
              </div>
              <div data-testid={childTid(cardRoot, "bottomRow")} className="flex items-center justify-between gap-3">
                <span data-testid={childTid(cardRoot, "progress")} className="text-sm text-gray-600">
                  {correctInSection}/{section.exercises.length} תרגילים ✓
                </span>
                {isCardLocked ? (
                  <span
                    data-testid={childTid(cardRoot, "lockedHint")}
                    className="text-sm font-semibold text-gray-400"
                  >
                    הַשְׁלֵם חִימּוּם תְּחִילָה
                  </span>
                ) : (
                  <Link
                    data-testid={testIds.screen.dayOverview.sectionCardCta(
                      effectiveGrade,
                      dayId,
                      section.id,
                    )}
                    href={routes.gradeSection(effectiveGrade, dayId, section.id, { previewAll })}
                    className={`touch-button rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm ${
                      isCardComplete
                        ? "border border-emerald-400 bg-white text-emerald-700"
                        : "btn-accent"
                    }`}
                  >
                    {isCardComplete ? "תִּרְגּוּל חוֹזֵר" : idx === 0 ? "הַתְחֵל" : "פְּתַח"}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion panel — shown when all sections are done */}
      {allSectionsComplete && (
        <CompletionPanel
          data-testid={testIds.screen.dayOverview.completionPanel(effectiveGrade, dayId)}
          icon="🎉"
          title="כָּל הַכָּבוֹד!"
          subtitle="כָּל הַחֲלָקִים הוּשְׁלְמוּ — עָשִׂיתָ עֲבוֹדָה מְצוּיֶנֶת!"
          actions={
            <button
              data-testid={testIds.screen.dayOverview.completeCta(effectiveGrade, dayId)}
              type="button"
              className="touch-button btn-accent w-full rounded-2xl py-4 text-lg font-semibold shadow-md"
              onClick={completeDay}
            >
              הַיּוֹם הוּשְׁלַם ✨
            </button>
          }
        />
      )}

      {/* Weak-spot review — shown when day is complete but some exercises were missed */}
      {weakExercises.length > 0 && (
        <div
          data-testid={testIds.screen.dayOverview.weakSpotPanel(effectiveGrade, dayId)}
          className="mb-6 rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm"
        >
          <p
            data-testid={childTid(testIds.screen.dayOverview.weakSpotPanel(effectiveGrade, dayId), "title")}
            className="mb-3 text-sm font-bold text-violet-900"
          >
            💪 רוצים לתרגל שוב? אלה התרגילים שכדאי לחזור עליהם:
          </p>
          <div
            data-testid={childTid(testIds.screen.dayOverview.weakSpotPanel(effectiveGrade, dayId), "list")}
            className="flex flex-col gap-2"
          >
            {weakExercises.map((exercise) => {
              const section = day
                ? findSectionForExercise(day.sections, exercise.id as ExerciseId)
                : undefined;
              if (!section) return null;
              return (
                <Link
                  key={exercise.id}
                  data-testid={testIds.screen.dayOverview.weakSpotExercise(
                    effectiveGrade,
                    dayId,
                    exercise.id,
                  )}
                  href={routes.gradeSection(effectiveGrade, dayId, section.id, { previewAll })}
                  className="rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-800 shadow-sm hover:bg-violet-50"
                >
                  {exercise.prompt}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <StarReward
        visible={showReward}
        onConfirm={() => {
          if (newlyUnlockedIds.length > 0) {
            setShowReward(false);
            setShowTrophy(true);
          } else {
            router.push(routes.gradeHome(effectiveGrade, { previewAll }));
          }
        }}
      />
      <TrophyUnlock
        visible={showTrophy}
        newBadgeIds={newlyUnlockedIds}
        onConfirm={() => {
          markAllSeen();
          router.push(routes.gradeHome(effectiveGrade, { previewAll }));
        }}
      />
    </main>
  );
}
