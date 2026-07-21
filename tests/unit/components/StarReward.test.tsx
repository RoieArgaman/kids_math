import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StarReward } from "@/components/StarReward";
import { testIds } from "@/lib/testIds";

describe("StarReward", () => {
  it("renders nothing when not visible", () => {
    render(<StarReward visible={false} onConfirm={vi.fn()} />);
    expect(screen.queryByTestId(testIds.component.starReward.dialog())).toBeNull();
  });

  it("renders a modal dialog with the default message when visible", () => {
    render(<StarReward visible onConfirm={vi.fn()} />);
    const dialog = screen.getByTestId(testIds.component.starReward.dialog());
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByTestId(testIds.component.starReward.message())).toHaveTextContent("הִשְׁלַמְתֶּם");
  });

  it("renders a custom message and fires onConfirm", async () => {
    const onConfirm = vi.fn();
    render(<StarReward visible text="מעולה!" onConfirm={onConfirm} />);
    expect(screen.getByTestId(testIds.component.starReward.message())).toHaveTextContent("מעולה!");
    await userEvent.click(screen.getByTestId(testIds.component.starReward.confirm()));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
