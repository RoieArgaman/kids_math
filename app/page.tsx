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
          href={routes.adminProgress()}
        >
          גישת אדמין
        </Link>
      </div>

      <HeroHeader
        data-testid={testIds.screen.subjectPicker.hero()}
        title="מה לומדים היום?"
        subtitle="בוחרים נושא כדי להתחיל."
        decorations={[
          { emoji: "🎒", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-[0.14] select-none" },
          { emoji: "✨", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-[0.18] select-none" },
        ]}
      />

      <section data-testid={childTid(testIds.screen.subjectPicker.root(), "grid")} className="grid gap-4 sm:grid-cols-2">
        <Link
          data-testid={testIds.screen.subjectPicker.mathCard()}
          className="surface border-s-4 p-5 shadow-sm hover:shadow-md transition-shadow"
          style={{ borderInlineStartColor: "var(--accent)" }}
          href={routes.mathHome({ previewAll })}
        >
          <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "content")}>
              <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "medallion")} className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#ede9fe]">
                <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "emoji")} className="leading-none" aria-hidden>
                  🔢
                </p>
              </div>
              <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "title")} className="mt-2 text-xl font-bold text-[--title]">
                חשבון
              </p>
              <p data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "subtitle")} className="mt-1 text-sm text-[--muted]">
                מסלול יומי לפי כיתה • חימום, שיעורים ומבחן מסכם
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "badge")} tone="info" className="px-3 py-1">
              כיתות א׳–ב׳
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.subjectPicker.mathCard(), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.subjectPicker.mathCardCta()} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
              ללימוד חשבון
            </span>
          </div>
        </Link>

        <Link
          data-testid={testIds.screen.subjectPicker.englishCard()}
          className="surface border-s-4 p-5 shadow-sm hover:shadow-md transition-shadow"
          style={{ borderInlineStartColor: "#34d399" }}
          href={routes.englishHome({ previewAll })}
          aria-label="אנגלית"
        >
          <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "content")}>
              <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "medallion")} className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#d1fae5]">
                <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "emoji")} className="leading-none" aria-hidden>
                  🔤
                </p>
              </div>
              <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "title")} className="mt-2 text-xl font-bold text-[--title]">
                אנגלית
              </p>
              <p data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "subtitle")} className="mt-1 text-sm text-[--muted]">
                לומדים אנגלית מעברית • הקשבה, בחירה והרכבת מילים
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "badge")} tone="info" className="px-3 py-1">
              חדש
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.subjectPicker.englishCard(), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.subjectPicker.englishCardCta()} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
              ללימוד אנגלית
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}
