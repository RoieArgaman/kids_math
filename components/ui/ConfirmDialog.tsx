"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  /** Rendered only when true; the dialog owns no open/closed state itself. */
  open: boolean;
  title: string;
  /** Body copy. Name the affected subject here so the action is never ambiguous. */
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Styles confirm as destructive and makes Cancel the autofocused default. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testIds?: { root?: string; confirm?: string; cancel?: string; title?: string };
}

/**
 * Modal confirmation. Destructive variants autofocus Cancel, so a stray Enter or a double-tap
 * landing on the freshly-mounted dialog cannot confirm the action.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "ביטול",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
  testIds: tid,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = tid?.title ?? "confirm-dialog-title";

  const onKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>("button:not([disabled])");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div
      data-testid={tid?.root}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onMouseDown={(e) => {
        // Backdrop dismiss only — a drag that ends outside the panel must not close it.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        data-testid={tid?.root ? `${tid.root}.panel` : undefined}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir="rtl"
        className="w-full max-w-sm rounded-2xl bg-white p-5 text-right shadow-xl"
      >
        <h2 id={titleId} data-testid={tid?.title} className="mb-2 text-lg font-bold text-slate-800">
          {title}
        </h2>
        <div
          data-testid={tid?.root ? `${tid.root}.body` : undefined}
          className="mb-5 space-y-1 text-sm leading-relaxed text-slate-600"
        >
          {children}
        </div>
        <div
          data-testid={tid?.root ? `${tid.root}.actions` : undefined}
          className="flex justify-start gap-2"
        >
          <Button
            data-testid={tid?.cancel}
            variant="outline"
            onClick={onCancel}
            disabled={busy}
            autoFocus={destructive}
          >
            {cancelLabel}
          </Button>
          <Button
            data-testid={tid?.confirm}
            variant={destructive ? "outline" : "accent"}
            className={
              destructive ? "border-transparent bg-[#dc2626] text-white hover:bg-[#b91c1c]" : undefined
            }
            onClick={onConfirm}
            disabled={busy}
            autoFocus={!destructive}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
