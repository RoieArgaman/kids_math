import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeachingPrimerExpandToggle } from "@/components/teaching-primer/TeachingPrimerExpandToggle";

describe("TeachingPrimerExpandToggle", () => {
  it("labels itself by the expanded state and exposes aria-expanded", () => {
    const { rerender } = render(<TeachingPrimerExpandToggle expanded={false} testId="t" onToggle={vi.fn()} />);
    expect(screen.getByTestId("t")).toHaveTextContent("הַרְחֵב אֶת הַהַסְבָּר");
    expect(screen.getByTestId("t")).toHaveAttribute("aria-expanded", "false");
    rerender(<TeachingPrimerExpandToggle expanded testId="t" onToggle={vi.fn()} />);
    expect(screen.getByTestId("t")).toHaveTextContent("צָמְצוּם הַהַסְבָּר");
    expect(screen.getByTestId("t")).toHaveAttribute("aria-expanded", "true");
  });

  it("fires onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<TeachingPrimerExpandToggle expanded={false} testId="t" onToggle={onToggle} />);
    await userEvent.click(screen.getByTestId("t"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
