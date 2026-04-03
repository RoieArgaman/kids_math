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
          className="list-decimal space-y-2 ps-5 text-amber-950"
        >
          {stepItems.map((step, idx) => (
            <li
              key={idx}
              data-testid={childTid(primerRoot, "step", String(idx))}
              className="marker:font-semibold"
            >
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
