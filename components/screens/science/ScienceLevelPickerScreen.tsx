"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import {
  SCIENCE_LEVELS,
  scienceLevelLabel,
  scienceLevelSubtitle,
  isScienceLevelUnlocked,
} from "@/lib/science/levels";
import { getScienceTotalDays, type ScienceLevel } from "@/lib/content/science-workbook";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

const LEVEL_EMOJI: Record<ScienceLevel, string> = { a: "🌱", b: "🔭" };

export function ScienceLevelPickerScreen() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({ a: true, b: false });

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    setUnlocked({
      a: true,
      b: isScienceLevelUnlocked("b", { previewAll: preview }),
    });
    setIsHydrated(true);
  }, []);

  const root = testIds.screen.science.levelPicker.root();

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.subjectPicker()}>חֲזָרָה לַבְּחִירָה</AppNavLink>
      </div>

      <HeroHeader
        data-testid={testIds.screen.science.levelPicker.hero()}
        title="מַדָּעִים 🔬"
        subtitle="בּוֹחֲרִים שָׁלָב כְּדֵי לְהַתְחִיל."
        decorations={[
          { emoji: "🌱", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "🔭", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
      />

      <section data-testid={childTid(root, "grid")} className="grid gap-4 sm:grid-cols-2">
        {SCIENCE_LEVELS.map((level) => {
          const isUnlocked = isHydrated ? unlocked[level] : level === "a";
          const cardId = testIds.screen.science.levelPicker.levelCard(level);
          const total = getScienceTotalDays(level);

          return (
            <div
              key={level}
              data-testid={cardId}
              className={`surface border-s-[5px] rounded-[22px] p-5 shadow-sm transition-all ${
                isUnlocked ? "" : "opacity-60"
              }`}
              style={{ borderInlineStartColor: level === "a" ? "#14b8a6" : "#0ea5e9" }}
            >
              <div data-testid={childTid(cardId, "row")} className="flex items-start justify-between gap-3">
                <div data-testid={childTid(cardId, "content")} className="min-w-0">
                  <div
                    data-testid={childTid(cardId, "medallion")}
                    className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#d1fae5] text-[32px]"
                  >
                    <span data-testid={childTid(cardId, "emoji")} aria-hidden>
                      {LEVEL_EMOJI[level]}
                    </span>
                  </div>
                  <p data-testid={childTid(cardId, "title")} className="mt-2 text-xl font-bold text-[--title]">
                    {scienceLevelLabel(level)}
                  </p>
                  <p data-testid={childTid(cardId, "subtitle")} className="mt-1 text-sm text-[--muted]">
                    {scienceLevelSubtitle(level)} • {total} שִׁעוּרִים וּמִבְחָן
                  </p>
                </div>
              </div>
              <div data-testid={childTid(cardId, "ctaRow")} className="mt-4">
                {isUnlocked ? (
                  <Link
                    data-testid={testIds.screen.science.levelPicker.levelCardCta(level)}
                    href={routes.scienceHome(level, { previewAll })}
                    className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold"
                  >
                    {level === "a" ? "לְכִיתָּה א׳" : "לְכִיתָּה ב׳"}
                  </Link>
                ) : (
                  <span
                    data-testid={testIds.screen.science.levelPicker.levelLockedHint(level)}
                    className="inline-flex w-full justify-center text-center text-sm font-semibold text-[#8a8298]"
                  >
                    🔒 עוֹבְרִים אֶת הַמִּבְחָן שֶׁל כִּיתָּה א׳ כְּדֵי לִפְתֹּחַ
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
