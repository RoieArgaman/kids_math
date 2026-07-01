import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OptionalBreakPanel } from "@/components/timed-exam/OptionalBreakPanel";
import { childTid } from "@/lib/testIds";
import { formatClock } from "@/lib/utils/format";

const ROOT = "km.test.break";

describe("OptionalBreakPanel", () => {
  it("renders the remaining time using the shared clock formatter", () => {
    render(<OptionalBreakPanel rootTestId={ROOT} remainingSeconds={90} onSkip={vi.fn()} />);
    expect(screen.getByTestId(childTid(ROOT, "timer"))).toHaveTextContent(formatClock(90));
  });

  it("skips on the CTA", async () => {
    const onSkip = vi.fn();
    render(<OptionalBreakPanel rootTestId={ROOT} remainingSeconds={30} onSkip={onSkip} />);
    await userEvent.click(screen.getByTestId(childTid(ROOT, "cta", "skip")));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
