import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

export type SurfaceVariant = "default" | "success" | "error";

export type SurfaceProps = {
  children: ReactNode;
  className?: string;
  variant?: SurfaceVariant;
  "data-testid"?: string;
};

function variantClassName(variant: SurfaceVariant): string {
  if (variant === "success") return "surface-success";
  if (variant === "error") return "surface-error";
  return "";
}

export function Surface({ children, className, variant = "default", "data-testid": testId }: SurfaceProps) {
  const merged = ["surface", variantClassName(variant), className].filter(Boolean).join(" ");
  return (
    <div data-testid={testId} className={merged}>
      <div data-testid={testId ? childTid(testId, "content") : undefined}>{children}</div>
    </div>
  );
}

