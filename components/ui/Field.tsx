"use client";

import type { ReactNode } from "react";

interface FieldProps {
  /** Wrapper testid (the `<div>` around label+control). */
  "data-testid"?: string;
  label: string;
  labelTestId?: string;
  htmlFor?: string;
  /** The control (input/select/etc.). */
  children: ReactNode;
  className?: string;
}

/**
 * Label + control wrapper matching the admin add-user form blocks
 * (`<div class="mb-3"><label class="mb-1 block text-sm font-semibold text-slate-600">…</div>`).
 * The caller supplies the control as children so its testid/classes stay verbatim.
 */
export function Field({
  "data-testid": testId,
  label,
  labelTestId,
  htmlFor,
  children,
  className = "mb-3",
}: FieldProps) {
  return (
    <div data-testid={testId} className={className}>
      <label data-testid={labelTestId} htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
