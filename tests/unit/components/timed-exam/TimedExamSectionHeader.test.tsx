import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TimedExamSectionHeader } from "@/components/timed-exam/TimedExamSectionHeader";
import { childTid } from "@/lib/testIds";
import { formatClock } from "@/lib/utils/format";

const ROOT = "km.test.examhdr";

describe("TimedExamSectionHeader", () => {
  it("renders the section title and the formatted remaining time", () => {
    render(<TimedExamSectionHeader rootTestId={ROOT} sectionTitle="כמות" remainingSeconds={125} />);
    expect(screen.getByTestId(childTid(ROOT, "title"))).toHaveTextContent("כמות");
    expect(screen.getByTestId(childTid(ROOT, "timer"))).toHaveTextContent(formatClock(125));
  });

  it("highlights the timer in the last minute", () => {
    const { rerender } = render(<TimedExamSectionHeader rootTestId={ROOT} sectionTitle="כמות" remainingSeconds={120} />);
    expect(screen.getByTestId(childTid(ROOT, "timer"))).not.toHaveClass("text-rose-700");
    rerender(<TimedExamSectionHeader rootTestId={ROOT} sectionTitle="כמות" remainingSeconds={45} />);
    expect(screen.getByTestId(childTid(ROOT, "timer"))).toHaveClass("text-rose-700");
  });
});
