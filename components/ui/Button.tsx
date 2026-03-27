import Link, { type LinkProps } from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "accent" | "disabled" | "outline";

type CommonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  "data-testid"?: string;
};

function variantClassName(variant: ButtonVariant): string {
  if (variant === "accent") return "btn-accent";
  if (variant === "disabled") return "btn-disabled";
  return "border-2 border-slate-200 bg-white text-slate-800 hover:bg-slate-50";
}

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> &
  CommonProps;

export function Button({
  children,
  className,
  variant = "accent",
  disabled,
  "data-testid": testId,
  ...rest
}: ButtonProps) {
  const computedVariant = disabled ? "disabled" : variant;
  const merged = ["touch-button", variantClassName(computedVariant), className].filter(Boolean).join(" ");
  return (
    <button data-testid={testId} className={merged} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export type ButtonLinkProps = Omit<LinkProps, "className" | "children"> &
  CommonProps & {
    "aria-label"?: string;
  };

export function ButtonLink({
  children,
  className,
  variant = "accent",
  "data-testid": testId,
  ...rest
}: ButtonLinkProps) {
  const merged = ["touch-button", variantClassName(variant), className].filter(Boolean).join(" ");
  return (
    <Link data-testid={testId} className={merged} {...rest}>
      {children}
    </Link>
  );
}

