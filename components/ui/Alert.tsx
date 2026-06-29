"use client";

import type { ReactNode } from "react";

export type AlertTone = "info" | "success" | "error";

interface AlertProps {
  tone: AlertTone;
  children: ReactNode;
  "data-testid"?: string;
  className?: string;
}

/**
 * Inline status / error banner. Reproduces the existing banner classes used for
 * admin status and the login error: a rounded, centered, tinted pill. `success`
 * matches the admin "user added/deleted" banner; `error` matches the login error.
 */
const TONE_CLASSES: Record<AlertTone, string> = {
  info: "bg-[#eef2ff] text-[#3730a3]",
  success: "bg-[#d1fae5] text-[#047857]",
  error: "bg-[#fee2e2] text-[#b91c1c]",
};

export function Alert({ tone, children, "data-testid": testId, className }: AlertProps) {
  const merged = [
    "rounded-xl px-4 py-2.5 text-center text-sm font-medium",
    TONE_CLASSES[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <p data-testid={testId} className={merged}>
      {children}
    </p>
  );
}
