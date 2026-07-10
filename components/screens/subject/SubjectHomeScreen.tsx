"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
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
    for (const day of days) {
      map[day.id] = progress.days[day.id]?.isComplete ?? false;
    }
    setCompleteMap(map);
    setIsHydrated(true);
    // days is module-stable for a given level; safe to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allDaysComplete = isHydrated && days.length > 0 && days.every((d) => completeMap[d.id]);
  const examUnlocked = isHydrated && (previewAll || allDaysComplete);

  const ids = config.home.testIds;
  const root = ids.root();

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.subjectsForGrade(level, { previewAll })}>חֲזָרָה לִבְחִירַת נוֹשֵׂא</AppNavLink>
      </div>

      <HeroHeader
        data-testid={ids.hero()}
        title={`${config.home.heroTitlePrefix} · ${config.levelLabel(level)}`}
        subtitle={config.levelSubtitle(level)}
        decorations={config.home.decorations}
      />

      <section data-testid={childTid(root, "grid")} className="flex flex-col gap-4">
        {days.map((day, idx) => {
          const previousComplete = idx === 0 ? true : (completeMap[days[idx - 1]!.id] ?? false);
          const previousDay = idx === 0 ? null : days[idx - 1]!;
          const isLocked =
            isHydrated && idx > 0
              ? !canUnlockNextDay(previousDay!, config.loadProgressState().days[previousDay!.id])
              : !previousComplete && idx > 0;
          const cardId = ids.dayCard(day.id);

          return (
            <div
              key={day.id}
              data-testid={cardId}
              className={`rounded-3xl border-2 p-5 shadow-sm transition-all ${
                isLocked ? "border-[#eceaf1] bg-[#faf9fc] opacity-60" : "border-[#efe9f7] bg-white"
              }`}
            >
              <div data-testid={childTid(cardId, "row")} className="flex items-center justify-between gap-3">
                <div data-testid={childTid(cardId, "info")} className="min-w-0 flex-1">
                  <p data-testid={childTid(cardId, "title")} className="text-base font-bold leading-tight">
                    {day.title}
                  </p>
                  <p data-testid={childTid(cardId, "objective")} className="mt-0.5 text-xs text-[#8a8298]">
                    {day.objective}
                  </p>
                </div>
                {isLocked ? (
                  <span data-testid={childTid(cardId, "lockedHint")} className="text-sm font-semibold text-[#8a8298]">
                    🔒 נָעוּל
                  </span>
                ) : (
                  <Link
                    data-testid={ids.dayCardCta(day.id)}
                    href={config.dayRoute(level, day.id)}
                    className="touch-button btn-accent rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm"
                  >
                    {completeMap[day.id] ? "חֲזָרָה" : "הַתְחֵל"}
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        <div
          data-testid={ids.examCard()}
          className={`rounded-3xl border-2 p-5 shadow-sm transition-all ${
            examUnlocked ? "border-[#e7defb] bg-[#ede9fe]" : "border-[#eceaf1] bg-[#faf9fc] opacity-60"
          }`}
        >
          <div data-testid={childTid(ids.examCard(), "row")} className="flex items-center justify-between gap-3">
            <div data-testid={childTid(ids.examCard(), "info")} className="min-w-0 flex-1">
              <p data-testid={childTid(ids.examCard(), "title")} className="text-base font-bold leading-tight">
                📝 מִבְחָן מְסַכֵּם · {config.levelLabel(level)}
              </p>
              <p data-testid={childTid(ids.examCard(), "objective")} className="mt-0.5 text-xs text-[#8a8298]">
                נִפְתָּח אַחֲרֵי שֶׁמַּשְׁלִימִים אֶת כָּל הַשִּׁעוּרִים בַּשָּׁלָב.
              </p>
            </div>
            {examUnlocked ? (
              <Link
                data-testid={ids.examCardCta()}
                href={config.examRoute(level, { previewAll })}
                className="touch-button btn-accent rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm"
              >
                לַמִּבְחָן
              </Link>
            ) : (
              <span data-testid={childTid(ids.examCard(), "lockedHint")} className="text-sm font-semibold text-[#8a8298]">
                🔒 נָעוּל
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
