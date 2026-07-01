import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentDashboardScreen } from "@/components/screens/ParentDashboardScreen";
import { testIds } from "@/lib/testIds";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("ParentDashboardScreen", () => {
  it("shows the loading/locked state until the PIN gate has been passed", () => {
    render(<ParentDashboardScreen />);
    expect(screen.getByTestId(testIds.screen.parentDashboard.root())).toBeInTheDocument();
  });
});
