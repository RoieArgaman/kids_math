"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { Surface } from "@/components/ui/Surface";
import type { GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export function ComingSoonScreen({ grade }: { grade: GradeId }) {
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main data-testid={testIds.screen.comingSoon.root(`${grade}.loading`)} className="pb-10">
        <Surface
          data-testid={childTid(testIds.screen.comingSoon.root(`${grade}.loading`), "status")}
          className="p-6 text-center text-lg font-semibold text-slate-600"
        >
          <span data-testid={childTid(testIds.screen.comingSoon.root(`${grade}.loading`), "statusText")} role="status" aria-live="polite">
            טוֹעֲנִים...
          </span>
        </Surface>
      </main>
    );
  }

  return (
    <main data-testid={testIds.screen.comingSoon.root(grade)}>
      <CenteredPanel
        data-testid={childTid(testIds.screen.comingSoon.root(grade), "panel")}
        emoji="⏳"
        title={
          <>
            כיתה {gradeLabel(grade)} — בקרוב
          </>
        }
        description={
          <>
            כיתה {gradeLabel(grade)} עוד בהכנה. בינתיים אפשר להתחיל בכיתה א׳ ולהתקדם במסלול היומי.
          </>
        }
        actions={
          <>
            <Link
              data-testid={testIds.screen.comingSoon.ctaStartGradeA()}
              className="touch-button btn-accent inline-block w-full text-center"
              href={routes.gradeHome("a", { previewAll })}
            >
              להתחיל בכיתה א׳
            </Link>
            <div data-testid={childTid(testIds.screen.comingSoon.root(grade), "secondary")} className="mt-3">
              <Link
                data-testid={testIds.screen.comingSoon.ctaGradePicker()}
                className="inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
                href={routes.gradePicker({ previewAll })}
              >
                לבחירת כיתה
              </Link>
            </div>
          </>
        }
      />
    </main>
  );
}

