import type { ReactNode } from "react";
import type { SectionType, WorkedExample } from "@/lib/types";
import { testIds } from "@/lib/testIds";
import { splitMathExpression } from "@/lib/utils/mathText";

interface SectionBlockProps {
  sectionId: string;
  title: string;
  learningGoal: string;
  type: SectionType;
  example?: WorkedExample;
  children: ReactNode;
  "data-testid"?: string;
}

const BORDER_BY_TYPE: Record<SectionType, string> = {
  warmup: "var(--section-warmup)",
  arithmetic: "var(--section-arithmetic)",
  geometry: "var(--section-geometry)",
  verbal: "var(--section-verbal)",
  challenge: "var(--section-challenge)",
  review: "var(--section-review)",
};

const EMOJI_BY_TYPE: Record<SectionType, string> = {
  warmup: "🔥",
  arithmetic: "🔢",
  geometry: "📐",
  verbal: "💬",
  challenge: "⚡",
  review: "📝",
};

export function SectionBlock({
  sectionId,
  title,
  learningGoal,
  type,
  example,
  children,
  "data-testid": dataTestId,
}: SectionBlockProps) {
  const examplePromptParts = example ? splitMathExpression(example.prompt) : null;
  const rootTestId = dataTestId ?? testIds.component.sectionBlock.root(sectionId);

  return (
    <section
      data-testid={rootTestId}
      className="surface mb-4 border-s-[6px] p-4"
      style={{ borderInlineStartColor: BORDER_BY_TYPE[type] }}
    >
      <h2 data-testid={testIds.component.sectionBlock.title(sectionId)} className="text-xl font-bold">
        <span
          data-testid={testIds.component.sectionBlock.emoji(sectionId)}
          className="me-2"
          aria-hidden="true"
          style={{ unicodeBidi: "isolate" }}
        >
          {EMOJI_BY_TYPE[type]}
        </span>
        {title}
      </h2>
      <p data-testid={testIds.component.sectionBlock.learningGoal(sectionId)} className="muted mt-1 text-base">
        {learningGoal}
      </p>
      {example ? (
        <article
          data-testid={testIds.component.sectionBlock.example.root(sectionId)}
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
          aria-label="דֻּגְמָה פְּתוּרָה"
        >
          <h3 data-testid={testIds.component.sectionBlock.example.title(sectionId)} className="font-semibold text-amber-900">
            {example.title}
          </h3>
          <p
            data-testid={testIds.component.sectionBlock.example.prompt(sectionId)}
            className="mt-1 text-sm text-amber-900"
            dir="rtl"
            style={{ unicodeBidi: "plaintext" }}
          >
            {examplePromptParts?.text}
          </p>
          {examplePromptParts?.math ? (
            <div
              data-testid={testIds.component.sectionBlock.example.math(sectionId)}
              className="math-line mt-2"
              dir="ltr"
              style={{ unicodeBidi: "isolate" }}
            >
              {examplePromptParts.math}
            </div>
          ) : null}
          <ol
            data-testid={testIds.component.sectionBlock.example.steps(sectionId)}
            className="mt-2 list-decimal space-y-1 pe-5 text-sm text-amber-950 marker:text-amber-700"
          >
            {example.steps.map((step, idx) => (
              <li data-testid={testIds.component.sectionBlock.example.step(sectionId, idx)} key={step}>
                {step}
              </li>
            ))}
          </ol>
          {example.takeaway ? (
            <p data-testid={testIds.component.sectionBlock.example.takeaway(sectionId)} className="mt-2 text-sm font-medium text-amber-900">
              {example.takeaway}
            </p>
          ) : null}
        </article>
      ) : null}
      <div data-testid={testIds.component.sectionBlock.body(sectionId)} className="mt-3">
        {children}
      </div>
    </section>
  );
}
