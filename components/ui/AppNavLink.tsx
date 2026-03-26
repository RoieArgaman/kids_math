import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

const defaultClassName =
  "inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2";

export type AppNavLinkProps = Omit<LinkProps, "className"> & {
  className?: string;
  children: ReactNode;
};

export function AppNavLink({ href, children, className, ...rest }: AppNavLinkProps) {
  const merged =
    className !== undefined && className !== ""
      ? `${defaultClassName} ${className}`.trim()
      : defaultClassName;

  return (
    <Link href={href} className={merged} {...rest}>
      {children}
    </Link>
  );
}
