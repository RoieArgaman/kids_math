"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { DayCardShell, type DayCardState } from "@/components/home/DayCardShell";
import { HeroHeader } from "@/components/ui/HeroHeader";
import type { GradeId } from "@/lib/grades";
import { canUnlockNextDay } from "@/lib/progress/engine";
import { childTid } from "@/lib/testIds";
import { routes } from "@/lib/routes";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import type { SubjectScreenConfig } from "@/lib/subjects/subjectScreenConfig";

/**
 * Shared subject Home screen (English + Science). All subject-specific data —
 * content/progress loaders, routes, labels, decorations, testids — comes from
 * `config`; the markup here is identical to what each subject used to render.
 */
export function SubjectHomeScreen({ config, level }: { config: SubjectScreenConfig; level: GradeId }) {
  const router = useRouter();
  const days = config.getDays(level);
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [completeMap, setCompleteMap] = useState<Record<string, boolean>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);

    // Level B is gated behind Level A completion — bounce back to the grade's
    // subject picker if locked (where this subject's card shows the locked hint).
    if (!config.isLevelUnlocked(level, { previewAll: preview })) {
      router.replace(routes.subjectsForGrade(level, { previewAll: preview }));
      return;
    }

    const progress = config.loadProgressState();
    const map: Record<string, boolean> = {};
    // percentDone was ALWAYS persisted here (subject stores reuse
    // WorkbookProgressState) — this screen just never read it. See D5.
    const scores: Record<string, number> = {};
    for (const day of days) {
      map[day.id] = progress.days[day.id]?.isComplete ?? false;
      scores[day.id] = progress.days[day.id]?.percentDone ?? 0;
    }
    setCompleteMap(map);
    setScoreMap(scores);
    setIsHydrated(true);
    // days is module-stable for a given level; safe to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDaysComplete = isHydrated && days.length > 0 && days.every((d) => completeMap[d.id]);
  const examUnlocked = isHydrated && (previewAll || allDaysComplete);

  const ids = config.home.testIds;
  const root = ids.root();

  return (
    <main data-testid={root} className="screen-wide pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.subjectsForGrade(level, { previewAll })}>חֲזָרָה לִבְחִירַת נוֹשֵׂא</AppNavLink>
      </div>

      <HeroHeader
        data-testid={ids.hero()}
        title={`${config.home.heroTitlePrefix} · ${config.levelLabel(level)}`}
        subtitle={config.levelSubtitle(level)}
        decorations={config.home.decorations}
      />

      <section data-testid={childTid(root, "grid")} className="grid gap-4 lg:grid-cols-2">
        {days.map((day, idx) => {
          const previousComplete = idx === 0 ? true : (completeMap[days[idx - 1]!.id] ?? false);
          const previousDay = idx === 0 ? null : days[idx - 1]!;
          const isLocked =
            isHydrated && idx > 0
              ? !canUnlockNextDay(previousDay!, config.loadProgressState().days[previousDay!.id])
              : !previousComplete && idx > 0;
          const cardId = ids.dayCard(day.id);
          const state: DayCardState = isLocked
            ? "locked"
            : (completeMap[day.id] ?? false)
              ? "complete"
              : "open";

          return (
            <DayCardShell
              key={day.id}
              rootTestId={cardId}
              ctaTestId={ids.dayCardCta(day.id)}
              dayNumber={idx + 1}
              title={day.title}
              objective={day.objective}
              state={state}
              score={scoreMap[day.id] ?? 0}
              ctaHref={config.dayRoute(level, day.id)}
              ctaLabel={state === "complete" ? "חֲזָרָה" : "הַתְחֵל"}
              lockedHint="סַיְּימוּ אֶת הַיּוֹם הַקּוֹדֵם כְּדֵי לִפְתּוֹחַ 🔒"
            />
          );
        })}

        <div
          data-testid={ids.examCard()}
          className={`rounded-panel border-2 p-5 shadow-xs transition-all ${
            examUnlocked ? "border-[#e7defb] bg-[#ede9fe]" : "is-locked"
          }`}
        >
          <div data-testid={childTid(ids.examCard(), "row")} className="flex items-center justify-between gap-3">
            <div data-testid={childTid(ids.examCard(), "info")} className="min-w-0 flex-1">
              <p data-testid={childTid(ids.examCard(), "title")} className="text-base font-bold leading-tight">
                📝 מִבְחָן מְסַכֵּם · {config.levelLabel(level)}
              </p>
              <p data-testid={childTid(ids.examCard(), "objective")} className="mt-0.5 text-xs text-[var(--muted)]">
                נִפְתָּח אַחֲרֵי שֶׁמַּשְׁלִימִים אֶת כָּל הַשִּׁעוּרִים בַּשָּׁלָב.
              </p>
            </div>
            {examUnlocked ? (
              <Link
                data-testid={ids.examCardCta()}
                href={config.examRoute(level, { previewAll })}
                className="touch-button btn-accent rounded-2xl px-5 py-3 text-sm font-semibold shadow-xs"
              >
                לַמִּבְחָן
              </Link>
            ) : (
              <span data-testid={childTid(ids.examCard(), "lockedHint")} className="text-sm font-semibold text-[var(--muted)]">
                🔒 נָעוּל
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
