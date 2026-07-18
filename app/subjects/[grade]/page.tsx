"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { Surface } from "@/components/ui/Surface";
import { AppNavLink } from "@/components/ui/AppNavLink";
import { logEvent } from "@/lib/analytics/events";
import { isSubjectUnlockedInGrade } from "@/lib/completion/subjectGrade";
import { reconcileGradeUnlockCookies } from "@/lib/completion/reconcile";
import { parseGradeId, gradeLabel, type GradeId } from "@/lib/grades";
import type { Subject } from "@/lib/subjects";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

type SubjectCardDef = {
  subject: Subject;
  cardTestId: string;
  ctaTestId: string;
  lockedHintTestId: string;
  emoji: string;
  medallionBg: string;
  borderColor: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: (grade: GradeId, opts: { previewAll: boolean }) => string;
  lockedHint: string;
};

const SUBJECT_CARDS: SubjectCardDef[] = [
  {
    subject: "math",
    cardTestId: testIds.screen.subjectPicker.mathCard(),
    ctaTestId: testIds.screen.subjectPicker.mathCardCta(),
    lockedHintTestId: testIds.screen.subjectPicker.lockedHint("math"),
    emoji: "🔢",
    medallionBg: "#ede9fe",
    borderColor: "var(--accent)",
    title: "חֶשְׁבּוֹן",
    subtitle: "מַסְלוּל יוֹמִי • חִימּוּם, שִׁיעוּרִים וּמִבְחָן מְסַכֵּם",
    ctaLabel: "לְלִימּוּד חֶשְׁבּוֹן",
    href: (grade, opts) => routes.gradeHome(grade, opts),
    lockedHint: "🔒 סַיְּימוּ חֶשְׁבּוֹן בְּכִיתָּה א׳ כְּדֵי לִפְתּוֹחַ",
  },
  {
    subject: "english",
    cardTestId: testIds.screen.subjectPicker.englishCard(),
    ctaTestId: testIds.screen.subjectPicker.englishCardCta(),
    lockedHintTestId: testIds.screen.subjectPicker.lockedHint("english"),
    emoji: "🔤",
    medallionBg: "#d1fae5",
    borderColor: "#34d399",
    title: "אַנְגְּלִית",
    subtitle: "הַקְשָׁבָה, בְּחִירָה וְהַרְכָּבַת מִילִּים",
    ctaLabel: "לְלִימּוּד אַנְגְּלִית",
    href: (grade, opts) => routes.englishHome(grade, opts),
    lockedHint: "🔒 סַיְּימוּ אַנְגְּלִית בְּכִיתָּה א׳ כְּדֵי לִפְתּוֹחַ",
  },
  {
    subject: "science",
    cardTestId: testIds.screen.subjectPicker.scienceCard(),
    ctaTestId: testIds.screen.subjectPicker.scienceCardCta(),
    lockedHintTestId: testIds.screen.subjectPicker.lockedHint("science"),
    emoji: "🔬",
    medallionBg: "#ccfbf1",
    borderColor: "#14b8a6",
    title: "מַדָּעִים",
    subtitle: "הַחוּשִׁים, בַּעֲלֵי חַיִּים, צְמָחִים וּמֶזֶג אֲוִיר",
    ctaLabel: "לְלִימּוּד מַדָּעִים",
    href: (grade, opts) => routes.scienceHome(grade, opts),
    lockedHint: "🔒 סַיְּימוּ מַדָּעִים בְּכִיתָּה א׳ כְּדֵי לִפְתּוֹחַ",
  },
];

export default function SubjectPickerPage({ params }: { params: { grade: string } }) {
  const grade = parseGradeId(params.grade);
  if (!grade) {
    notFound();
  }
  const safeGrade = grade as GradeId;

  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [unlockedMap, setUnlockedMap] = useState<Record<Subject, boolean>>({
    math: false,
    english: false,
    science: false,
  });

  useEffect(() => {
    let cancelled = false;
    const preview = getPreviewAllFromLocation();
    setPreviewAll(preview);
    void reconcileGradeUnlockCookies({ previewAll: preview }).finally(() => {
      if (cancelled) return;
      setUnlockedMap({
        math: isSubjectUnlockedInGrade("math", safeGrade, { previewAll: preview }),
        english: isSubjectUnlockedInGrade("english", safeGrade, { previewAll: preview }),
        science: isSubjectUnlockedInGrade("science", safeGrade, { previewAll: preview }),
      });
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [safeGrade]);

  const heroSubtitle = useMemo(
    () => `כִּיתָּה ${gradeLabel(safeGrade)} • בּוֹחֲרִים נוֹשֵׂא כְּדֵי לְהַתְחִיל`,
    [safeGrade],
  );

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
      <div data-testid={childTid(testIds.screen.subjectPicker.root(), "topNav")} className="mb-4 flex items-center justify-between gap-3">
        <AppNavLink data-testid={testIds.screen.subjectPicker.navBack()} href={routes.gradePicker({ previewAll })}>
          חֲזָרָה לִבְחִירַת כִּיתָּה
        </AppNavLink>
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
        subtitle={heroSubtitle}
        decorations={[
          { emoji: "🎒", className: "pointer-events-none absolute -left-4 -top-4 text-7xl opacity-[0.14] select-none" },
          { emoji: "✨", className: "pointer-events-none absolute bottom-2 right-4 text-5xl opacity-[0.18] select-none" },
        ]}
      />

      <section data-testid={childTid(testIds.screen.subjectPicker.root(), "grid")} className="grid gap-4 sm:grid-cols-2">
        {SUBJECT_CARDS.map((card) => {
          const unlocked = unlockedMap[card.subject];
          const cardInner = (
            <>
              <div data-testid={childTid(card.cardTestId, "row")} className="flex items-start justify-between gap-3">
                <div data-testid={childTid(card.cardTestId, "content")}>
                  <div
                    data-testid={childTid(card.cardTestId, "medallion")}
                    className="w-[58px] h-[58px] rounded-[18px] flex items-center justify-center text-[32px]"
                    style={{ backgroundColor: card.medallionBg }}
                  >
                    <p data-testid={childTid(card.cardTestId, "emoji")} className="leading-none" aria-hidden>
                      {card.emoji}
                    </p>
                  </div>
                  <p data-testid={childTid(card.cardTestId, "title")} className="mt-2 text-xl font-bold text-[--title]">
                    {card.title}
                  </p>
                  <p data-testid={childTid(card.cardTestId, "subtitle")} className="mt-1 text-sm text-[--muted]">
                    {card.subtitle}
                  </p>
                </div>
                <Chip data-testid={childTid(card.cardTestId, "badge")} tone={unlocked ? "info" : "warning"} className="px-3 py-1">
                  {unlocked ? `כִּיתָּה ${gradeLabel(safeGrade)}` : "🔒 נְעוּלָה"}
                </Chip>
              </div>
              <div data-testid={childTid(card.cardTestId, "ctaRow")} className="mt-4">
                {unlocked ? (
                  <span data-testid={card.ctaTestId} className="touch-button btn-accent inline-flex w-full justify-center text-center font-semibold">
                    {card.ctaLabel}
                  </span>
                ) : (
                  <p data-testid={card.lockedHintTestId} className="text-center text-sm text-[--muted]">
                    {card.lockedHint}
                  </p>
                )}
              </div>
            </>
          );

          return unlocked ? (
            <Link
              key={card.subject}
              data-testid={card.cardTestId}
              className="surface border-s-[5px] rounded-[22px] p-5 shadow-xs hover:shadow-md transition-shadow"
              style={{ borderInlineStartColor: card.borderColor }}
              href={card.href(safeGrade, { previewAll })}
              aria-label={card.title}
              onClick={() =>
                logEvent("subject_selected", { payload: { grade: safeGrade }, subject: card.subject, gradeId: safeGrade })
              }
            >
              {cardInner}
            </Link>
          ) : (
            <div
              key={card.subject}
              data-testid={card.cardTestId}
              className="surface border-s-[5px] rounded-[22px] p-5 opacity-60"
              style={{ borderInlineStartColor: card.borderColor }}
              aria-label={`${card.title} (נעולה)`}
            >
              {cardInner}
            </div>
          );
        })}
      </section>
    </main>
  );
}
