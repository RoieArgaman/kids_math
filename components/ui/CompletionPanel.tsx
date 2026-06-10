import type { ReactNode } from "react";
import { childTid } from "@/lib/testIds";

interface CompletionPanelProps {
  icon: string;
  iconClassName?: string;
  title: string;
  titleClassName?: string;
  subtitle: string;
  actions: ReactNode;
  "data-testid": string;
}

export function CompletionPanel({
  icon,
  iconClassName = "text-5xl",
  title,
  titleClassName = "text-2xl",
  subtitle,
  actions,
  "data-testid": testId,
}: CompletionPanelProps) {
  return (
    <div
      data-testid={testId}
      className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 to-green-200 p-6 text-center shadow-md"
    >
      <p
        data-testid={childTid(testId, "icon")}
        className={`mb-1 ${iconClassName}`}
        aria-hidden="true"
      >
        {icon}
      </p>
      <p
        data-testid={childTid(testId, "title")}
        className={`mb-1 font-semibold text-emerald-900 ${titleClassName}`}
      >
        {title}
      </p>
      <p
        data-testid={childTid(testId, "subtitle")}
        className="mb-4 text-sm font-semibold text-emerald-700"
      >
        {subtitle}
      </p>
      <div data-testid={childTid(testId, "actions")}>{actions}</div>
    </div>
  );
}
