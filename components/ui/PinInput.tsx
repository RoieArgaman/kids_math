"use client";

import { Button } from "@/components/ui/Button";

interface PinInputProps {
  /** DOM id for the input; the label's `htmlFor` and aria-describedby derive from it. */
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Fired on Enter and on submit-button click. */
  onSubmit: () => void;
  label: string;
  submitLabel: string;
  error?: string;
  testIds: {
    label: string;
    input: string;
    error: string;
    submit: string;
  };
}

/**
 * PIN entry panel shared by the admin hub and admin progress gate. Reproduces the
 * exact markup/classes/testids of the original AdminHub PIN panel (numeric password
 * field, ltr direction, inline error, full-width submit).
 */
export function PinInput({
  id,
  value,
  onChange,
  onSubmit,
  label,
  submitLabel,
  error,
  testIds,
}: PinInputProps) {
  const errorId = `${id}-error`;
  return (
    <>
      <label data-testid={testIds.label} htmlFor={id} className="block text-sm font-semibold text-[#4f4860]">
        {label}
      </label>
      <input
        id={id}
        data-testid={testIds.input}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-hidden focus-visible:ring-2 focus-visible:ring-[#a78bfa]"
        type="password"
        inputMode="numeric"
        dir="ltr"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit();
        }}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <p id={errorId} data-testid={testIds.error} className="text-sm font-semibold text-[#b91c1c]">
          {error}
        </p>
      ) : null}
      <Button data-testid={testIds.submit} className="w-full" onClick={onSubmit}>
        {submitLabel}
      </Button>
    </>
  );
}
