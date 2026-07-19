"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { ButtonLink } from "@/components/ui/Button";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { StarReward } from "@/components/StarReward";
import { COMPLETION_GATE_PERCENT } from "@/lib/progress/engine";
import { useProgress } from "@/lib/hooks/useProgress";
import { childTid } from "@/lib/testIds";
import { routes } from "@/lib/routes";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import type { GradeId } from "@/lib/grades";
import type { DayId, ExerciseId, Section } from "@/lib/types";
import type { SubjectScreenConfig } from "@/lib/subjects/subjectScreenConfig";

type SectionCardState = "locked" | "open" | "complete";

function getSectionCardState(
  section: Section,
  sectionIdx: number,
  allSections: Section[],
  correctAnswers: Record<ExerciseId, boolean>,
): SectionCardState {
  const isComplete = section.exercises.every((ex) => correctAnswers[ex.id] === true);
  if (isComplete) return "complete";
  if (sectionIdx === 0) return "open";
  if (sectionIdx === allSections.length - 1) {
    const allOthersComplete = allSections
      .slice(0, -1)
      .every((s) => s.exercises.every((ex) => correctAnswers[ex.id] === true));
    return allOthersComplete ? "open" : "locked";
  }
  const warmupComplete = allSections[0]?.exercises.every((ex) => correctAnswers[ex.id] === true) ?? false;
  return warmupComplete ? "open" : "locked";
}

/**
 * Shared subject Day screen (English + Science). All subject-specific data —
 * content loader, progress subject, routes, labels, testids, section emoji —
 * comes from `config`; the markup here is identical to what each subject used
 * to render.
 */
export function SubjectDayScreen({
  config,
  level,
  dayId,
}: {
  config: SubjectScreenConfig;
  level: GradeId;
  dayId: DayId;
}) {
  const router = useRouter();
  const { markComplete, percentDone, correctAnswers } = useProgress(dayId, {
    subject: config.progressSubject,
  });
  const day = useMemo(() => config.getAllDays().find((d) => d.id === dayId), [config, dayId]);
  const [showReward, setShowReward] = useState(false);
  // QA bypass — read on the client only (SSR default false) to keep back-links
  // carrying previewAll into the now middleware-gated grade-B subtrees.
  const [previewAll, setPreviewAll] = useState(false);
  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
  }, []);

  const sectionStates = useMemo(() => {
    if (!day) return {} as Record<string, SectionCardState>;
    return Object.fromEntries(
      day.sections.map((section, idx) => [
        section.id,
        getSectionCardState(section, idx, day.sections, correctAnswers),
      ]),
    );
  }, [day, correctAnswers]);

  const allSectionsComplete = useMemo(
    () => Boolean(day) && day!.sections.every((s) => sectionStates[s.id] === "complete"),
    [day, sectionStates],
  );

  const ids = config.day.testIds;

  if (!day) {
    return (
      <main data-testid={ids.root(`${dayId}.not-found`)}>
        <CenteredPanel
          emoji="🔍"
          title="הַשִּׁעוּר לֹא נִמְצָא."
          actions={
            <ButtonLink href={config.homeRoute(level, { previewAll })} className="w-full text-center">
              {config.backToSubjectLabel}
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const root = ids.root(dayId);

  const completeDay = () => {
    if (!markComplete()) return;
    setShowReward(true);
  };

  return (
    <main data-testid={root}>
      <div
        data-testid={ids.nav(dayId)}
        className="mb-3 flex flex-wrap items-center justify-between gap-3"
      >
        <AppNavLink href={config.homeRoute(level, { previewAll })}>{config.backToSubjectLabel}</AppNavLink>
        <AppNavLink href={routes.subjectsForGrade(level, { previewAll })}>חֲזָרָה לִבְחִירַת נוֹשֵׂא</AppNavLink>
      </div>

      <div
        data-testid={childTid(root, "progressBar")}
        className="mb-4 rounded-[18px] border border-[#efe9f7] bg-white/95 px-4 py-3 shadow-[0_2px_12px_rgba(80,60,140,0.05)] backdrop-blur-xs"
      >
        <p data-testid={childTid(root, "progressBar", "label")} className="mb-1 text-xs font-semibold text-[#8a8298]">
          📊 הַהִתְקַדְּמוּת שֶׁלִּי:
        </p>
        <ProgressBar value={percentDone} label={`הַיַּעַד לְהַשְׁלָמָה: ${COMPLETION_GATE_PERCENT}%`} />
      </div>

      <div data-testid={childTid(root, "header")} className="mb-4 rounded-card border border-[#efe9f7] bg-white p-5 shadow-[0_2px_12px_rgba(80,60,140,0.05)]">
        <h1 data-testid={childTid(root, "title")} className="text-2xl font-bold">
          {day.title}
        </h1>
        <p data-testid={childTid(root, "objective")} className="mt-1 text-sm text-[#8a8298]">
          {day.objective}
        </p>
        {day.teachingSummary ? (
          <p data-testid={childTid(root, "summary")} className="mt-3 text-base leading-relaxed text-[#4f4860]">
            {day.teachingSummary}
          </p>
        ) : null}
      </div>

      <div data-testid={childTid(root, "sections")} className="mb-6 flex flex-col gap-4">
        {day.sections.map((section, idx) => {
          const state = sectionStates[section.id] ?? "locked";
          const isCardLocked = state === "locked";
          const isCardComplete = state === "complete";
          const correctInSection = section.exercises.filter((ex) => correctAnswers[ex.id] === true).length;
          const cardRoot = ids.sectionCard(dayId, section.id);

          return (
            <div
              key={section.id}
              data-testid={cardRoot}
              className={`rounded-panel border-2 p-5 shadow-xs transition-all ${
                isCardComplete
                  ? "border-[#bbf7d0] bg-[#f4fcf7]"
                  : isCardLocked
                    ? "is-locked"
                    : "border-[#efe9f7] bg-white"
              }`}
            >
              <div data-testid={childTid(cardRoot, "topRow")} className="mb-3 flex items-center gap-3">
                <span data-testid={childTid(cardRoot, "emoji")} className="text-3xl">
                  {isCardComplete ? "✅" : isCardLocked ? "🔒" : config.day.sectionCardEmoji}
                </span>
                <div data-testid={childTid(cardRoot, "info")} className="min-w-0 flex-1">
                  <p data-testid={childTid(cardRoot, "cardTitle")} className="text-base font-bold leading-tight">
                    {section.title}
                  </p>
                  <p data-testid={childTid(cardRoot, "goal")} className="mt-0.5 text-xs text-[#8a8298]">
                    {section.learningGoal}
                  </p>
                </div>
              </div>
              <div data-testid={childTid(cardRoot, "bottomRow")} className="flex items-center justify-between gap-3">
                <span data-testid={childTid(cardRoot, "progress")} className="text-sm text-[#8a8298]">
                  {correctInSection}/{section.exercises.length} תרגילים ✓
                </span>
                {isCardLocked ? (
                  <span data-testid={childTid(cardRoot, "lockedHint")} className="text-sm font-semibold text-[#8a8298]">
                    הַשְׁלִימוּ אֶת הַחֵלֶק הַקּוֹדֵם
                  </span>
                ) : (
                  <Link
                    data-testid={ids.sectionCardCta(dayId, section.id)}
                    href={config.sectionRoute(level, dayId, section.id)}
                    className={`touch-button rounded-2xl px-5 py-3 text-sm font-semibold shadow-xs ${
                      isCardComplete ? "border border-[#a7f3d0] bg-white text-[#047857]" : "btn-accent"
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

      {allSectionsComplete && (
        <div
          data-testid={ids.completionPanel(dayId)}
          className="mb-6 rounded-panel border border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] to-[#d1fae5] p-6 text-center shadow-md"
        >
          <p data-testid={childTid(ids.completionPanel(dayId), "icon")} className="mb-1 text-5xl">
            🎉
          </p>
          <p
            data-testid={childTid(ids.completionPanel(dayId), "title")}
            className="mb-4 text-2xl font-semibold text-[#047857]"
          >
            כָּל הַכָּבוֹד!
          </p>
          <button
            data-testid={ids.completeCta(dayId)}
            type="button"
            className="touch-button btn-accent w-full rounded-2xl py-4 text-lg font-semibold shadow-md"
            onClick={completeDay}
          >
            הַשִּׁעוּר הוּשְׁלַם ✨
          </button>
        </div>
      )}

      <StarReward
        visible={showReward}
        onConfirm={() => {
          setShowReward(false);
          router.push(config.homeRoute(level));
        }}
      />
    </main>
  );
}
