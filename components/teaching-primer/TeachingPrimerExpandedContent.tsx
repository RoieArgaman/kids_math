import { childTid } from "@/lib/testIds";

type TeachingPrimerExpandedContentProps = {
  primerRoot: string;
  summaryText: string;
  stepItems: string[];
};

export function TeachingPrimerExpandedContent({
  primerRoot,
  summaryText,
  stepItems,
}: TeachingPrimerExpandedContentProps) {
  return (
    <>
      {summaryText ? (
        <p data-testid={childTid(primerRoot, "summary")}>{summaryText}</p>
      ) : null}
      {stepItems.length > 0 ? (
        <ol
          data-testid={childTid(primerRoot, "steps")}
          className="space-y-3 ps-0"
        >
          {stepItems.map((step, idx) => (
            <li
              key={idx}
              data-testid={childTid(primerRoot, "step", String(idx))}
              className="flex items-start gap-3"
            >
              <span
                data-testid={childTid(primerRoot, "step", String(idx), "num")}
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-300 text-xs font-bold text-amber-950"
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <span data-testid={childTid(primerRoot, "step", String(idx), "text")}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
