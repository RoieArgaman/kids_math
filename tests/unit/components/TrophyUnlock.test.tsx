import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrophyUnlock } from "@/components/TrophyUnlock";
import { childTid, testIds } from "@/lib/testIds";

const dialog = testIds.component.trophyUnlock.dialog();

describe("TrophyUnlock", () => {
  it("renders nothing when not visible", () => {
    render(<TrophyUnlock visible={false} newBadgeIds={["first-day-done"]} onConfirm={vi.fn()} />);
    expect(screen.queryByTestId(dialog)).toBeNull();
  });

  it("renders a modal listing each newly unlocked badge", () => {
    render(<TrophyUnlock visible newBadgeIds={["first-day-done"]} onConfirm={vi.fn()} />);
    expect(screen.getByTestId(dialog)).toHaveAttribute("role", "dialog");
    expect(screen.getByTestId(childTid(dialog, "badgeRow", "first-day-done"))).toBeInTheDocument();
  });

  it("confirms on the CTA", async () => {
    const onConfirm = vi.fn();
    render(<TrophyUnlock visible newBadgeIds={["first-day-done"]} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByTestId(testIds.component.trophyUnlock.confirm()));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
