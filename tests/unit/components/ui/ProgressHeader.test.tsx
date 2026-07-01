import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressHeader } from "@/components/ui/ProgressHeader";
import { childTid } from "@/lib/testIds";

const TID = "km.test.progress";

describe("ProgressHeader", () => {
  it("renders the target label", () => {
    render(<ProgressHeader data-testid={TID} percentDone={40} label="2/5" />);
    expect(screen.getByTestId(childTid(TID, "target"))).toHaveTextContent("2/5");
  });

  it("shows the wrong-answer badge only when both wrongCount and maxWrong are given", () => {
    const { rerender } = render(<ProgressHeader data-testid={TID} percentDone={40} label="2/5" />);
    expect(screen.queryByTestId(childTid(TID, "wrongBadge"))).toBeNull();

    rerender(<ProgressHeader data-testid={TID} percentDone={40} label="2/5" wrongCount={1} maxWrong={3} />);
    expect(screen.getByTestId(childTid(TID, "wrongBadge"))).toHaveTextContent("1/3");
  });

  it("still shows the badge when wrongCount is 0 (falsy-but-present)", () => {
    render(<ProgressHeader data-testid={TID} percentDone={0} label="0/5" wrongCount={0} maxWrong={3} />);
    expect(screen.getByTestId(childTid(TID, "wrongBadge"))).toHaveTextContent("0/3");
  });
});
