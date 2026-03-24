import type { ReactNode } from "react";
import type { SectionType, WorkedExample } from "@/lib/types";

interface SectionBlockProps {
  title: string;
  learningGoal: string;
  type: SectionType;
  example?: WorkedExample;
  children: ReactNode;
}

function splitMathExpression(prompt: string): { text: string; math?: string } {
  const match = prompt.match(/(\d[\d\s+\-*=?.]+)/);
  if (!match) {
    return { text: prompt };
  }

  const math = match[1].trim();
  const text = prompt.replace(match[1], "").replace(/\s{2,}/g, " ").trim();
  if (!/[+\-=]/.test(math)) {
    return { text: prompt };
  }

  return { text, math };
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
  title,
  learningGoal,
  type,
  example,
  children,
}: SectionBlockProps) {
  const examplePromptParts = example ? splitMathExpression(example.prompt) : null;

  return (
    <section
      className="surface mb-4 border-s-[6px] p-4"
      style={{ borderInlineStartColor: BORDER_BY_TYPE[type] }}
    >
      <h2 className="text-xl font-bold">
        <span className="me-2" aria-hidden="true" style={{ unicodeBidi: "isolate" }}>{EMOJI_BY_TYPE[type]}</span>
        {title}
      </h2>
      <p className="muted mt-1 text-base">{learningGoal}</p>
      {example ? (
        <article className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="דֻּגְמָה פְּתוּרָה">
          <h3 className="font-semibold text-amber-900">{example.title}</h3>
          <p className="mt-1 text-sm text-amber-900">{examplePromptParts?.text}</p>
          {examplePromptParts?.math ? (
            <div className="math-line mt-1" dir="ltr">
              {examplePromptParts.math}
            </div>
          ) : null}
          <ol className="mt-2 list-decimal space-y-1 pe-5 text-sm text-amber-950 marker:text-amber-700">
            {example.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {example.takeaway ? <p className="mt-2 text-sm font-medium text-amber-900">{example.takeaway}</p> : null}
        </article>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
