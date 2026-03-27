"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { logEvent } from "@/lib/analytics/events";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export default function GradePickerPage() {
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [gradeAFinalPassed, setGradeAFinalPassed] = useState(false);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setGradeAFinalPassed(Boolean(loadFinalExamState("a")?.passed));
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.gradePicker.root()} className="pb-10">
        <Surface data-testid={childTid(testIds.screen.gradePicker.root(), "loading")} className="p-6 text-center text-lg font-semibold text-slate-600">
          טוֹעֲנִים...
        </Surface>
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.gradePicker.root()} className="pb-10">
      <div data-testid={childTid(testIds.screen.gradePicker.root(), "topNav")} className="mb-4">
        <Link
          data-testid={testIds.screen.gradePicker.adminCta()}
          className="touch-button inline-flex"
          href={routes.adminProgress()}
        >
          גישת אדמין
        </Link>
      </div>

      <HeroHeader
        data-testid={testIds.screen.gradePicker.hero()}
        title="בוחרים כיתה"
        subtitle="כדי להתחיל, בחרו את החוברת המתאימה."
        decorations={[
          { emoji: "🎒", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "🔢", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
      />

      <section data-testid={childTid(testIds.screen.gradePicker.root(), "grid")} className="grid gap-4 sm:grid-cols-2">
        <Link
          data-testid={testIds.screen.gradePicker.gradeCard("a")}
          className="surface p-5 shadow-sm hover:shadow-md transition-shadow"
          href={routes.gradeHome("a", { previewAll })}
          onClick={() => logEvent("grade_selected", { payload: { grade: "a" } })}
        >
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "content")}>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "emoji")} className="text-4xl leading-none" aria-hidden>
                🧮
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "title")} className="mt-2 text-xl font-bold text-violet-900">
                כיתה א׳
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "subtitle")} className="muted mt-1 text-sm">
                מסלול יומי • פתיחה הדרגתית לפי התקדמות
              </p>
            </div>
            {gradeAFinalPassed ? (
              <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "badge")} tone="success" className="px-3 py-1">
                הושלם (מבחן מסכם)
              </Chip>
            ) : (
              <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "badge")} tone="info" className="px-3 py-1">
                מומלץ
              </Chip>
            )}
          </div>
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.gradePicker.gradeCardCta("a")} className="touch-button btn-accent inline-flex w-full justify-center text-center">
              להתחיל בכיתה א׳
            </span>
          </div>
        </Link>

        <Link
          data-testid={testIds.screen.gradePicker.gradeCard("b")}
          className="surface p-5 shadow-sm hover:shadow-md transition-shadow"
          href={routes.gradeHome("b", { previewAll })}
          onClick={() => logEvent("grade_selected", { payload: { grade: "b" } })}
          aria-label="כיתה ב׳"
        >
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "content")}>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "emoji")} className="text-4xl leading-none" aria-hidden>
                📘
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "title")} className="mt-2 text-xl font-bold text-violet-900">
                כיתה ב׳
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "subtitle")} className="muted mt-1 text-sm">
                נפתחת אחרי שעוברים את מבחן המסכם בכיתה א׳
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "badge")} tone="neutral" className="px-3 py-1">
              המשך מסלול
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.gradePicker.gradeCardCta("b")} className="touch-button inline-flex w-full justify-center text-center">
              לכיתה ב׳
            </span>
          </div>
        </Link>
      </section>
    </main>
  );
}
