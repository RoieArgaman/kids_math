"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { routes } from "@/lib/routes";
import { childTid } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";
import type { SubjectScreenConfig } from "@/lib/subjects/subjectScreenConfig";

/**
 * Shared subject LevelPicker screen (English + Science). All subject-specific
 * data comes from `config`; the markup here is identical to what each subject
 * used to render.
 */
export function SubjectLevelPickerScreen({ config }: { config: SubjectScreenConfig }) {
  const firstLevel = config.levels[0]!;
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const lvl of config.levels) init[lvl] = lvl === firstLevel;
    return init;
  });

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    const next: Record<string, boolean> = {};
    for (const lvl of config.levels) {
      next[lvl] = lvl === firstLevel ? true : config.isLevelUnlocked(lvl, { previewAll: preview });
    }
    setUnlocked(next);
    setIsHydrated(true);
    // config is module-stable; safe to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ids = config.levelPicker.testIds;
  const root = ids.root();

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.subjectPicker()}>חֲזָרָה לַבְּחִירָה</AppNavLink>
      </div>

      <HeroHeader
        data-testid={ids.hero()}
        title={config.levelPicker.heroTitle}
        subtitle="בּוֹחֲרִים שָׁלָב כְּדֵי לְהַתְחִיל."
        decorations={config.levelPicker.decorations}
      />

      <section data-testid={childTid(root, "grid")} className="grid gap-4 sm:grid-cols-2">
        {config.levels.map((level) => {
          const isUnlocked = isHydrated ? unlocked[level] : level === firstLevel;
          const cardId = ids.levelCard(level);
          const total = config.getTotalDays(level);

          return (
            <div
              key={level}
              data-testid={cardId}
              className={`surface border-s-[5px] rounded-[22px] p-5 shadow-xs transition-all ${
                isUnlocked ? "" : "opacity-60"
              }`}
              style={{ borderInlineStartColor: config.levelPicker.medallionBorderColor(level) }}
            >
              <div data-testid={childTid(cardId, "row")} className="flex items-start justify-between gap-3">
                <div data-testid={childTid(cardId, "content")} className="min-w-0">
                  <div
                    data-testid={childTid(cardId, "medallion")}
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#d1fae5] text-[32px]"
                  >
                    <span data-testid={childTid(cardId, "emoji")} aria-hidden>
                      {config.levelPicker.levelEmoji[level]}
                    </span>
                  </div>
                  <p data-testid={childTid(cardId, "title")} className="mt-2 text-xl font-bold text-[--title]">
                    {config.levelLabel(level)}
                  </p>
                  <p data-testid={childTid(cardId, "subtitle")} className="mt-1 text-sm text-[--muted]">
                    {config.levelSubtitle(level)} • {total} שִׁעוּרִים וּמִבְחָן
                  </p>
                </div>
              </div>
              <div data-testid={childTid(cardId, "ctaRow")} className="mt-4">
                {isUnlocked ? (
                  <Link
                    data-testid={ids.levelCardCta(level)}
                    href={config.homeRoute(level, { previewAll })}
                    className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold"
                  >
                    {config.levelPicker.levelCtaLabel(level)}
                  </Link>
                ) : (
                  <span
                    data-testid={ids.levelLockedHint(level)}
                    className="inline-flex w-full justify-center text-center text-sm font-semibold text-[#8a8298]"
                  >
                    {config.levelPicker.lockedHint}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
