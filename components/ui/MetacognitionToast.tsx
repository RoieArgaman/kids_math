"use client";

import { useEffect, useState } from "react";
import { testIds } from "@/lib/testIds";

type MetacognitionToastProps = {
  visible: boolean;
  onDismiss: () => void;
};

const AUTO_DISMISS_MS = 4000;

export function MetacognitionToast({ visible, onDismiss }: MetacognitionToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      onDismiss();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!show) return null;

  return (
    <div
      data-testid={testIds.component.metacognitionToast.root()}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-900 shadow-lg"
      dir="rtl"
    >
      🤔 יָפֶה! אֵיךְ חִשַּׁבְתָּ אֶת זֶה?
    </div>
  );
}
