"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { HeroHeader } from "@/components/ui/HeroHeader";
import {
  ENGLISH_LEVELS,
  englishLevelLabel,
  englishLevelSubtitle,
  isEnglishLevelUnlocked,
} from "@/lib/english/levels";
import { getEnglishTotalDays, type EnglishLevel } from "@/lib/content/english-workbook";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

const LEVEL_EMOJI: Record<EnglishLevel, string> = { a: "🔤", b: "📖" };

export function EnglishLevelPickerScreen() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [previewAll, setPreviewAll] = useState(false);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({ a: true, b: false });

  useEffect(() => {
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    setUnlocked({
      a: true,
      b: isEnglishLevelUnlocked("b", { previewAll: preview }),
    });
    setIsHydrated(true);
  }, []);

  const root = testIds.screen.english.levelPicker.root();

  return (
    <main data-testid={root} className="pb-10">
      <div data-testid={childTid(root, "nav")} className="mb-4">
        <AppNavLink href={routes.subjectPicker()}>חֲזָרָה לַבְּחִירָה</AppNavLink>
      </div>

      <HeroHeader
        data-testid={testIds.screen.english.levelPicker.hero()}
        title="אַנְגְּלִית 🔤"
        subtitle="בּוֹחֲרִים שָׁלָב כְּדֵי לְהַתְחִיל."
        decorations={[
          { emoji: "🇬🇧", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "🎧", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
      />

      <section data-testid={childTid(root, "grid")} className="grid gap-4 sm:grid-cols-2">
        {ENGLISH_LEVELS.map((level) => {
          const isUnlocked = isHydrated ? unlocked[level] : level === "a";
          const cardId = testIds.screen.english.levelPicker.levelCard(level);
          const total = getEnglishTotalDays(level);

          return (
            <div
              key={level}
              data-testid={cardId}
              className={`surface border-s-[5px] rounded-[22px] p-5 shadow-sm transition-all ${
                isUnlocked ? "" : "opacity-60"
              }`}
              style={{ borderInlineStartColor: level === "a" ? "#34d399" : "#818cf8" }}
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
                    {englishLevelLabel(level)}
                  </p>
                  <p data-testid={childTid(cardId, "subtitle")} className="mt-1 text-sm text-[--muted]">
                    {englishLevelSubtitle(level)} • {total} שִׁעוּרִים וּמִבְחָן
                  </p>
                </div>
              </div>
              <div data-testid={childTid(cardId, "ctaRow")} className="mt-4">
                {isUnlocked ? (
                  <Link
                    data-testid={testIds.screen.english.levelPicker.levelCardCta(level)}
                    href={routes.englishHome(level, { previewAll })}
                    className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold"
                  >
                    {level === "a" ? "לְשָׁלָב א׳" : "לְשָׁלָב ב׳"}
                  </Link>
                ) : (
                  <span
                    data-testid={testIds.screen.english.levelPicker.levelLockedHint(level)}
                    className="inline-flex w-full justify-center text-center text-sm font-semibold text-[#8a8298]"
                  >
                    🔒 עוֹבְרִים אֶת הַמִּבְחָן שֶׁל שָׁלָב א׳ כְּדֵי לִפְתֹּחַ
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
