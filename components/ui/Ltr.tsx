import type { ReactNode } from "react";

/** LTR-wrapped numeral so percentages/counts render correctly inside an RTL view. */
export function Ltr({
  children,
  "data-testid": testId,
}: {
  children: ReactNode;
  "data-testid"?: string;
}) {
  return (
    <span dir="ltr" data-testid={testId}>
      {children}
    </span>
  );
}
