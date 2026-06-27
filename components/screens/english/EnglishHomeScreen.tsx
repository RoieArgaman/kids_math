"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { getEnglishDays, type EnglishLevel } from "@/lib/content/english-workbook";
import { englishLevelLabel, englishLevelSubtitle, isEnglishLevelUnlocked } from "@/lib/english/levels";
import { canUnlockNextDay } from "@/lib/progress/engine";
import { loadEnglishProgressState } from "@/lib/english/storage";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export function EnglishHomeScreen({ level }: { level: EnglishLevel }) {
  const router = useRouter();
  const days = getEnglishDays(level);
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [completeMap, setCompleteMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);

    // Level B is gated behind Level A's final exam — bounce back to the picker if locked.
    if (!isEnglishLevelUnlocked(level, { previewAll: preview })) {
      router.replace(routes.englishLevelPicker({ previewAll: preview }));
      return;
    }

    const progress = loadEnglishProgressState();
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

  const root = testIds.screen.english.home.root();

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.englishLevelPicker({ previewAll })}>חֲזָרָה לִבְחִירַת שָׁלָב</AppNavLink>
      </div>

      <HeroHeader
        data-testid={testIds.screen.english.home.hero()}
        title={`אַנְגְּלִית · ${englishLevelLabel(level)}`}
        subtitle={englishLevelSubtitle(level)}
        decorations={[
          { emoji: "🇬🇧", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "🎧", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
      />

      <section data-testid={childTid(root, "grid")} className="flex flex-col gap-4">
        {days.map((day, idx) => {
          const previousComplete = idx === 0 ? true : (completeMap[days[idx - 1]!.id] ?? false);
          const previousDay = idx === 0 ? null : days[idx - 1]!;
          const isLocked =
            isHydrated && idx > 0
              ? !canUnlockNextDay(previousDay!, loadEnglishProgressState().days[previousDay!.id])
              : !previousComplete && idx > 0;
          const cardId = testIds.screen.english.home.dayCard(day.id);

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
                    data-testid={testIds.screen.english.home.dayCardCta(day.id)}
                    href={routes.englishDay(level, day.id)}
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
          data-testid={testIds.screen.english.home.examCard()}
          className={`rounded-3xl border-2 p-5 shadow-sm transition-all ${
            examUnlocked ? "border-[#e7defb] bg-[#ede9fe]" : "border-[#eceaf1] bg-[#faf9fc] opacity-60"
          }`}
        >
          <div data-testid={childTid(testIds.screen.english.home.examCard(), "row")} className="flex items-center justify-between gap-3">
            <div data-testid={childTid(testIds.screen.english.home.examCard(), "info")} className="min-w-0 flex-1">
              <p data-testid={childTid(testIds.screen.english.home.examCard(), "title")} className="text-base font-bold leading-tight">
                📝 מִבְחָן מְסַכֵּם · {englishLevelLabel(level)}
              </p>
              <p data-testid={childTid(testIds.screen.english.home.examCard(), "objective")} className="mt-0.5 text-xs text-[#8a8298]">
                נִפְתָּח אַחֲרֵי שֶׁמַּשְׁלִימִים אֶת כָּל הַשִּׁעוּרִים בַּשָּׁלָב.
              </p>
            </div>
            {examUnlocked ? (
              <Link
                data-testid={testIds.screen.english.home.examCardCta()}
                href={routes.englishExam(level, { previewAll })}
                className="touch-button btn-accent rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm"
              >
                לַמִּבְחָן
              </Link>
            ) : (
              <span data-testid={childTid(testIds.screen.english.home.examCard(), "lockedHint")} className="text-sm font-semibold text-[#8a8298]">
                🔒 נָעוּל
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
