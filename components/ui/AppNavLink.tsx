import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

const baseClassName =
  "inline-flex items-center gap-1 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2";

const toneClassName = {
  default: "text-violet-700 hover:text-violet-900",
  primary: "text-[var(--accent)] hover:text-[var(--accent-strong)]",
  muted: "text-[var(--muted)] hover:text-[var(--title)]",
} as const;

export type AppNavLinkTone = keyof typeof toneClassName;

export type AppNavLinkProps = Omit<LinkProps, "className"> & {
  className?: string;
  tone?: AppNavLinkTone;
  children: ReactNode;
};

export function AppNavLink({ href, children, className, tone = "default", ...rest }: AppNavLinkProps) {
  const merged = [baseClassName, toneClassName[tone], className].filter(Boolean).join(" ");

  return (
    <Link href={href} className={merged} {...rest}>
      {children}
    </Link>
  );
}
