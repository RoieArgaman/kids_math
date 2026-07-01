import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayOverviewScreen } from "@/components/screens/DayOverviewScreen";
import type { DayId } from "@/lib/types";
import { testIds } from "@/lib/testIds";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/hooks/useProgress", () => ({
  useProgress: () => ({ markComplete: vi.fn(() => false), percentDone: 0, isComplete: false, correctAnswers: {} }),
}));
vi.mock("@/lib/hooks/useDayUnlockStatus", () => ({
  useDayUnlockStatus: () => ({ previewAll: false, isRouteReady: true, isLocked: false }),
}));

describe("DayOverviewScreen", () => {
  it("shows a not-found panel for an unknown day id", () => {
    render(<DayOverviewScreen grade="a" dayId={"day-99999" as DayId} />);
    expect(screen.getByTestId(testIds.screen.dayOverview.root("a", "day-99999.not-found"))).toBeInTheDocument();
  });
});
