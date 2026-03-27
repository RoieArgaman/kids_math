"use client";

import { Surface } from "@/components/ui/Surface";
import { childTid } from "@/lib/testIds";
import type { GmatSectionKey } from "@/lib/gmat-challenge/types";

type SectionOrderPickerProps = {
  rootTestId: string;
  order: GmatSectionKey[];
  labels: Record<GmatSectionKey, string>;
  onChangeOrder: (next: GmatSectionKey[]) => void;
  onConfirm: () => void;
};

export function SectionOrderPicker({
  rootTestId,
  order,
  labels,
  onChangeOrder,
  onConfirm,
}: SectionOrderPickerProps) {
  function moveUp(i: number): void {
    if (i <= 0) return;
    const next = order.slice();
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChangeOrder(next);
  }

  function moveDown(i: number): void {
    if (i >= order.length - 1) return;
    const next = order.slice();
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    onChangeOrder(next);
  }

  return (
    <Surface data-testid={rootTestId} variant="default" className="rounded-3xl p-6 shadow-sm">
      <h2 data-testid={childTid(rootTestId, "title")} className="text-lg font-bold text-slate-900">
        סדר המקטעים
      </h2>
      <p data-testid={childTid(rootTestId, "hint")} className="muted mt-2 text-sm">
        בחרו את סדר המקטעים לפני שמתחילים. אפשר לשנות בעזרת הכפתורים.
      </p>
      <ul data-testid={childTid(rootTestId, "list")} className="mt-4 space-y-3">
        {order.map((key, i) => (
          <li
            key={`${key}-${i}`}
            data-testid={childTid(rootTestId, "row", i)}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
          >
            <span data-testid={childTid(rootTestId, "row", i, "label")} className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
              {i + 1}. {labels[key]}
            </span>
            <button
              type="button"
              data-testid={childTid(rootTestId, "row", i, "up")}
              className="touch-button rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-40"
              disabled={i === 0}
              onClick={() => moveUp(i)}
            >
              למעלה
            </button>
            <button
              type="button"
              data-testid={childTid(rootTestId, "row", i, "down")}
              className="touch-button rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:opacity-40"
              disabled={i === order.length - 1}
              onClick={() => moveDown(i)}
            >
              למטה
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid={childTid(rootTestId, "cta", "confirm")}
        className="touch-button btn-accent mt-6 w-full"
        onClick={onConfirm}
      >
        מתחילים
      </button>
    </Surface>
  );
}
