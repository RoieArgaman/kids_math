"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export default function SubjectPickerPage() {
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.subjectPicker.root()} className="pb-10">
        <Surface data-testid={childTid(testIds.screen.subjectPicker.root(), "loading")} className="p-6 text-center text-lg font-semibold text-slate-600">
          טוֹעֲנִים...
        </Surface>
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.subjectPicker.root()} className="pb-10">
      <div data-testid={childTid(testIds.screen.subjectPicker.root(), "topNav")} className="mb-4">
        <Link
          data-testid={testIds.screen.subjectPicker.adminCta()}
          className="touch-button inline-flex"
          href={routes.adminHub()}
        >
          גִּישַׁת אַדְמִין
        </Link>
      </div>

      <HeroHeader
        data-testid={testIds.screen.subjectPicker.hero()}
        title="מָה לוֹמְדִים הַיּוֹם?"
        subtitle="בּוֹחֲרִים נוֹשֵׂא כְּדֵי לְהַתְחִיל."
        decorations={[
          { emoji: "🎒", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-[0.14] select-none" },
          { emoji: "✨", className: "pointer-events-none absolute bottom-2 right-4 text-5xl opacity-[0.18] select-none" },
        ]}
      />

      <section data-testid={childTid(testIds.screen.subjectPicker.root(), "grid")} className="grid gap-4 sm:grid-cols-2">
        <Link
          data-testid={testIds.screen.subjectPicker.mathCard()}
          className="surface border-s-[5px] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-shadow"
          style={{ borderInlineStartColor: "var(--accent)" }}
          href={routes.mathHome({ previewAll })}
        >
          <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "content")}>
              <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "medallion")} className="w-[58px] h-[58px] rounded-[18px] flex items-center justify-center text-[32px] bg-[#ede9fe]">
                <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "emoji")} className="leading-none" aria-hidden>
                  🔢
                </p>
              </div>
              <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "title")} className="mt-2 text-xl font-bold text-[--title]">
                חֶשְׁבּוֹן
              </p>
              <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "subtitle")} className="mt-1 text-sm text-[--muted]">
                מַסְלוּל יוֹמִי לְפִי כִּיתָּה • חִימּוּם, שִׁיעוּרִים וּמִבְחָן מְסַכֵּם
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "badge")} tone="info" className="px-3 py-1">
              כִּיתּוֹת א׳–ב׳
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.subjectPicker.mathCardCta()} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
              לְלִימּוּד חֶשְׁבּוֹן
            </span>
          </div>
        </Link>

        <Link
          data-testid={testIds.screen.subjectPicker.englishCard()}
          className="surface border-s-[5px] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-shadow"
          style={{ borderInlineStartColor: "#34d399" }}
          href={routes.englishLevelPicker({ previewAll })}
          aria-label="אנגלית"
        >
          <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "content")}>
              <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "medallion")} className="w-[58px] h-[58px] rounded-[18px] flex items-center justify-center text-[32px] bg-[#d1fae5]">
                <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "emoji")} className="leading-none" aria-hidden>
                  🔤
                </p>
              </div>
              <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "title")} className="mt-2 text-xl font-bold text-[--title]">
                אַנְגְּלִית
              </p>
              <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "subtitle")} className="mt-1 text-sm text-[--muted]">
                לוֹמְדִים אַנְגְּלִית מֵעִבְרִית • הַקְשָׁבָה, בְּחִירָה וְהַרְכָּבַת מִילִּים
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "badge")} tone="info" className="px-3 py-1">
              חָדָשׁ
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.subjectPicker.englishCardCta()} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
              לְלִימּוּד אַנְגְּלִית
            </span>
          </div>
        </Link>

        <Link
          data-testid={testIds.screen.subjectPicker.scienceCard()}
          className="surface border-s-[5px] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-shadow"
          style={{ borderInlineStartColor: "#14b8a6" }}
          href={routes.scienceLevelPicker({ previewAll })}
          aria-label="מדעים"
        >
          <div data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "content")}>
              <div data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "medallion")} className="w-[58px] h-[58px] rounded-[18px] flex items-center justify-center text-[32px] bg-[#ccfbf1]">
                <p data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "emoji")} className="leading-none" aria-hidden>
                  🔬
                </p>
              </div>
              <p data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "title")} className="mt-2 text-xl font-bold text-[--title]">
                מַדָּעִים
              </p>
              <p data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "subtitle")} className="mt-1 text-sm text-[--muted]">
                חוֹקְרִים אֶת הָעוֹלָם • הַחוּשִׁים, בַּעֲלֵי חַיִּים, צְמָחִים וּמֶזֶג אֲוִיר
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "badge")} tone="info" className="px-3 py-1">
              חָדָשׁ
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.subjectPicker.scienceCard(), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.subjectPicker.scienceCardCta()} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
              לְלִימּוּד מַדָּעִים
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}
