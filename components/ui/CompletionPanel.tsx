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
      className="mb-6 rounded-[22px] border border-[#bbf7d0] bg-gradient-to-br from-[#f0fdf4] to-[#d1fae5] p-6 text-center shadow-[0_2px_14px_rgba(16,185,129,0.10)]"
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
        className={`mb-1 font-bold text-[#047857] ${titleClassName}`}
      >
        {title}
      </p>
      <p
        data-testid={childTid(testId, "subtitle")}
        className="mb-4 text-sm font-medium text-[#15803d]"
      >
        {subtitle}
      </p>
      <div data-testid={childTid(testId, "actions")}>{actions}</div>
    </div>
  );
}
