import type { ReactNode } from "react";
import { Surface } from "@/components/ui/Surface";
import { childTid } from "@/lib/testIds";

export type LegalSectionProps = {
  rootTestId: string;
  sectionKey: string;
  title: string;
  paragraphs?: readonly string[];
  listItems?: readonly string[];
  footer?: ReactNode;
};

export function LegalSection({ rootTestId, sectionKey, title, paragraphs, listItems, footer }: LegalSectionProps) {
  const base = childTid(rootTestId, "section", sectionKey);
  return (
    <Surface className="p-5 sm:p-6" data-testid={base}>
      <div data-testid={childTid(base, "stack")} className="space-y-3">
        <h2 data-testid={childTid(base, "heading")} className="text-lg font-bold text-violet-900">
          {title}
        </h2>
        {paragraphs?.map((text, i) => (
          <p key={i} data-testid={childTid(base, "p", i)} className="leading-relaxed">
            {text}
          </p>
        ))}
        {listItems ? (
          <ul data-testid={childTid(base, "ul")} className="list-disc space-y-2 ps-5 leading-relaxed">
            {listItems.map((text, i) => (
              <li key={i} data-testid={childTid(base, "li", i)}>
                {text}
              </li>
            ))}
          </ul>
        ) : null}
        {footer ? <div data-testid={childTid(base, "footer")}>{footer}</div> : null}
      </div>
    </Surface>
  );
}
