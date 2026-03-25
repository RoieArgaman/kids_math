"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { logEvent } from "@/lib/analytics/events";
import { routes } from "@/lib/routes";
import { getPreviewAllFromLocation } from "@/lib/utils/preview";

export default function GradePickerPage() {
  const [previewAll, setPreviewAll] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setPreviewAll(getPreviewAllFromLocation());
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <main className="pb-10">
        <div className="surface p-6 text-center text-lg font-semibold text-slate-600">טוֹעֲנִים...</div>
      </main>
    );
  }

  return (
    <main className="pb-10">
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-l from-violet-200 to-sky-100 p-6 shadow-md border border-violet-200">
        <span className="pointer-events-none absolute -left-4 -top-4 text-7xl opacity-15 select-none" aria-hidden>
          🎒
        </span>
        <span className="pointer-events-none absolute right-4 top-2 text-5xl opacity-20 select-none" aria-hidden>
          🔢
        </span>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight text-violet-900">בוחרים כיתה</h1>
          <p className="mt-2 text-sm text-violet-700">כדי להתחיל, בחרו את החוברת המתאימה.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          className="surface p-5 shadow-sm hover:shadow-md transition-shadow"
          href={routes.gradeHome("a", { previewAll })}
          onClick={() => logEvent("grade_selected", { payload: { grade: "a" } })}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-4xl leading-none" aria-hidden>
                🧮
              </p>
              <p className="mt-2 text-xl font-bold text-violet-900">כיתה א׳</p>
              <p className="muted mt-1 text-sm">מסלול יומי • פתיחה הדרגתית לפי התקדמות</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
              מומלץ
            </span>
          </div>
          <div className="mt-4">
            <span className="touch-button btn-accent inline-flex w-full justify-center text-center">להתחיל בכיתה א׳</span>
          </div>
        </Link>

        <Link
          className="surface p-5 shadow-sm hover:shadow-md transition-shadow"
          href={routes.gradeHome("b", { previewAll })}
          onClick={() => logEvent("grade_selected", { payload: { grade: "b" } })}
          aria-label="כיתה ב׳ — בקרוב (פרטים)"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-4xl leading-none" aria-hidden>
                📘
              </p>
              <p className="mt-2 text-xl font-bold text-violet-900">כיתה ב׳</p>
              <p className="muted mt-1 text-sm">עדיין בבנייה</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              בקרוב
            </span>
          </div>
          <div className="mt-4">
            <span className="touch-button inline-flex w-full justify-center text-center">לצפייה בפרטים</span>
          </div>
        </Link>
      </section>
    </main>
  );
}
