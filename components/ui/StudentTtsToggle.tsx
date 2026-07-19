"use client";

import { useAdminTtsEnabled } from "@/lib/hooks/useAdminTtsEnabled";
import { useStudentTts } from "@/components/providers/StudentTtsProvider";
import { childTid, testIds } from "@/lib/testIds";

export function StudentTtsToggle() {
  const { ttsEnabled, hydrated: adminHydrated } = useAdminTtsEnabled();
  const { autoPlay, setAutoPlay, hydrated: studentHydrated } = useStudentTts();

  if (!adminHydrated || !studentHydrated || !ttsEnabled) return null;

  const baseId = testIds.component.topBar.studentTtsToggle();

  return (
    <button
      type="button"
      data-testid={baseId}
      onClick={() => setAutoPlay(!autoPlay)}
      aria-pressed={autoPlay}
      aria-label={autoPlay ? "כיבוי הקראה אוטומטית" : "הפעלת הקראה אוטומטית"}
      className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        autoPlay
          ? "border-[#cdbff2] bg-[#ede9fe] text-[var(--accent-strong)]"
          : "border-[#e7defb] bg-white text-[var(--muted)] hover:bg-[#f3effb]"
      }`}
    >
      {autoPlay ? (
        <>
          <span data-testid={childTid(baseId, "pulse")} className="relative flex size-2 shrink-0">
            <span
              data-testid={childTid(baseId, "pulse", "ring")}
              className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent-soft)] opacity-75"
            />
            <span
              data-testid={childTid(baseId, "pulse", "dot")}
              className="relative inline-flex size-2 rounded-full bg-[var(--accent)]"
            />
          </span>
          <span data-testid={childTid(baseId, "icon")} aria-hidden="true">🔊</span>
          <span data-testid={childTid(baseId, "label")}>קוֹל פָּעִיל</span>
        </>
      ) : (
        <>
          <span data-testid={childTid(baseId, "icon")} aria-hidden="true">🔇</span>
          <span data-testid={childTid(baseId, "label")}>קוֹל כָּבוּי</span>
        </>
      )}
    </button>
  );
}
