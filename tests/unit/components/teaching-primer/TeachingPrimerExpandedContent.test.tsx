import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeachingPrimerExpandedContent } from "@/components/teaching-primer/TeachingPrimerExpandedContent";
import { childTid } from "@/lib/testIds";

const ROOT = "km.test.primer";

describe("TeachingPrimerExpandedContent", () => {
  it("renders the summary and a numbered step list", () => {
    render(<TeachingPrimerExpandedContent primerRoot={ROOT} summaryText="סיכום" stepItems={["צעד א", "צעד ב"]} />);
    expect(screen.getByTestId(childTid(ROOT, "summary"))).toHaveTextContent("סיכום");
    expect(screen.getByTestId(childTid(ROOT, "step", "0", "num"))).toHaveTextContent("1");
    expect(screen.getByTestId(childTid(ROOT, "step", "1", "text"))).toHaveTextContent("צעד ב");
  });

  it("omits the summary and step list when empty", () => {
    render(<TeachingPrimerExpandedContent primerRoot={ROOT} summaryText="" stepItems={[]} />);
    expect(screen.queryByTestId(childTid(ROOT, "summary"))).toBeNull();
    expect(screen.queryByTestId(childTid(ROOT, "steps"))).toBeNull();
  });
});
