"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { logEvent } from "@/lib/analytics/events";
import { isGradeUnlocked } from "@/lib/completion/subjectGrade";
import { reconcileGradeUnlockCookies } from "@/lib/completion/reconcile";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

/**
 * Landing GRADE picker — top of the Grade → Subject → Day flow. Grade A is always
 * open; Grade B unlocks once ANY subject is completed in Grade A. On mount we
 * reconcile the server unlock cookies with local completion (self-heals a lost
 * cookie) BEFORE enabling the Grade B CTA, so clicking through never trips the
 * middleware gate.
 */
export default function GradePickerPage() {
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [gradeBUnlocked, setGradeBUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    void reconcileGradeUnlockCookies({ previewAll: preview }).finally(() => {
      if (cancelled) return;
      setGradeBUnlocked(isGradeUnlocked("b", { previewAll: preview }));
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
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
      <div data-testid={childTid(testIds.screen.gradePicker.root(), "topNav")} className="mb-4 flex items-center justify-end gap-3">
        <Link
          data-testid={testIds.screen.gradePicker.adminCta()}
          className="touch-button inline-flex"
          href={routes.adminHub()}
        >
          גִּישַׁת אַדְמִין
        </Link>
      </div>

      <HeroHeader
        data-testid={testIds.screen.gradePicker.hero()}
        title="בּוֹחֲרִים כִּיתָּה"
        subtitle="כְּדֵי לְהַתְחִיל, בּוֹחֲרִים אֶת הַכִּיתָּה — וְאָז אֶת הַנּוֹשֵׂא."
        decorations={[
          { emoji: "🎒", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" },
          { emoji: "✨", className: "pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" },
        ]}
      />

      <section data-testid={childTid(testIds.screen.gradePicker.root(), "grid")} className="grid gap-4 sm:grid-cols-2">
        <Link
          data-testid={testIds.screen.gradePicker.gradeCard("a")}
          className="surface p-5 shadow-xs hover:shadow-md transition-shadow"
          href={routes.subjectsForGrade("a", { previewAll })}
          onClick={() => logEvent("grade_selected", { payload: { grade: "a" }, gradeId: "a" })}
        >
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "row")} className="flex items-start justify-between gap-3">
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "content")}>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "emoji")} className="text-4xl leading-none" aria-hidden>
                🧮
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "title")} className="mt-2 text-xl font-bold text-[var(--title)]">
                כִּיתָּה א׳
              </p>
              <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "subtitle")} className="muted mt-1 text-sm">
                חֶשְׁבּוֹן, אַנְגְּלִית וּמַדָּעִים — הַכֹּל פָּתוּחַ
              </p>
            </div>
            <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "badge")} tone="info" className="px-3 py-1">
              מוּמְלָץ
            </Chip>
          </div>
          <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("a"), "ctaRow")} className="mt-4">
            <span data-testid={testIds.screen.gradePicker.gradeCardCta("a")} className="touch-button btn-accent inline-flex w-full justify-center text-center">
              לִבְחִירַת נוֹשֵׂא בְּכִיתָּה א׳
            </span>
          </div>
        </Link>

        {gradeBUnlocked ? (
          <Link
            data-testid={testIds.screen.gradePicker.gradeCard("b")}
            className="surface p-5 shadow-xs hover:shadow-md transition-shadow"
            href={routes.subjectsForGrade("b", { previewAll })}
            onClick={() => logEvent("grade_selected", { payload: { grade: "b" }, gradeId: "b" })}
            aria-label="כיתה ב׳"
          >
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "row")} className="flex items-start justify-between gap-3">
              <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "content")}>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "emoji")} className="text-4xl leading-none" aria-hidden>
                  📘
                </p>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "title")} className="mt-2 text-xl font-bold text-[var(--title)]">
                  כִּיתָּה ב׳
                </p>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "subtitle")} className="muted mt-1 text-sm">
                  כָּל נוֹשֵׂא שֶׁסִּיַּמְתֶּם בְּכִיתָּה א׳ נִפְתָּח כָּאן
                </p>
              </div>
              <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "badge")} tone="neutral" className="px-3 py-1">
                הֶמְשֵׁךְ מַסְלוּל
              </Chip>
            </div>
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "ctaRow")} className="mt-4">
              <span data-testid={testIds.screen.gradePicker.gradeCardCta("b")} className="touch-button inline-flex w-full justify-center text-center">
                לִבְחִירַת נוֹשֵׂא בְּכִיתָּה ב׳
              </span>
            </div>
          </Link>
        ) : (
          <div
            data-testid={testIds.screen.gradePicker.gradeCard("b")}
            className="surface is-locked p-5"
            aria-label="כיתה ב׳ (נעולה)"
          >
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "row")} className="flex items-start justify-between gap-3">
              <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "content")}>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "emoji")} className="locked-dim text-4xl leading-none" aria-hidden>
                  📘
                </p>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "title")} className="mt-2 text-xl font-bold text-[var(--title)]">
                  כִּיתָּה ב׳
                </p>
                <p data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "subtitle")} className="muted mt-1 text-sm">
                  נִפְתַּחַת אַחֲרֵי שֶׁמְּסַיְּימִים נוֹשֵׂא אֶחָד בְּכִיתָּה א׳
                </p>
              </div>
              <Chip data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "badge")} tone="warning" className="px-3 py-1">
                🔒 נְעוּלָה
              </Chip>
            </div>
            <div data-testid={childTid(testIds.screen.gradePicker.gradeCard("b"), "ctaRow")} className="mt-4">
              <p data-testid={testIds.screen.gradePicker.gradeLockedHint("b")} className="muted text-center text-sm">
                סַיְּימוּ נוֹשֵׂא אֶחָד בְּכִיתָּה א׳ (כָּל הַיָּמִים וְהַמִּבְחָן הַמְּסַכֵּם) כְּדֵי לִפְתּוֹחַ 🔒
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
