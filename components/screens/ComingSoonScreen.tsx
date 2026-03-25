"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GradeId } from "@/lib/grades";
import { gradeLabel } from "@/lib/grades";
import { routes } from "@/lib/routes";
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
      <main className="pb-10">
        <div
          className="surface p-6 text-center text-lg font-semibold text-slate-600"
          role="status"
          aria-live="polite"
        >
          טוֹעֲנִים...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="surface mx-auto max-w-sm rounded-3xl p-8 text-center shadow-lg">
        <p className="mb-2 text-6xl" aria-hidden>
          ⏳
        </p>
        <h1 className="mb-2 text-xl font-semibold text-gray-800">כיתה {gradeLabel(grade)} — בקרוב</h1>
        <p className="mb-6 text-sm text-gray-500">
          כיתה {gradeLabel(grade)} עוד בהכנה. בינתיים אפשר להתחיל בכיתה א׳ ולהתקדם במסלול היומי.
        </p>
        <Link
          className="touch-button btn-accent inline-block w-full text-center"
          href={routes.gradeHome("a", { previewAll })}
        >
          להתחיל בכיתה א׳
        </Link>
        <div className="mt-3">
          <Link
            className="inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
            href={routes.gradePicker({ previewAll })}
          >
            לבחירת כיתה
          </Link>
        </div>
      </div>
    </main>
  );
}

