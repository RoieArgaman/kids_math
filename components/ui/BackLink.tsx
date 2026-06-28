import type { ReactNode } from "react";
import { ButtonLink, type ButtonLinkProps } from "@/components/ui/Button";

/**
 * A back-navigation link. Thin wrapper over `ButtonLink` so the many "חזרה…"
 * back buttons share one component without changing rendered output. All
 * `ButtonLink` props (variant, className, onClick, aria-label, …) pass through.
 */
export type BackLinkProps = Omit<ButtonLinkProps, "children"> & {
  href: string;
  children: ReactNode;
};

export function BackLink({ children, ...rest }: BackLinkProps) {
  return <ButtonLink {...rest}>{children}</ButtonLink>;
}
