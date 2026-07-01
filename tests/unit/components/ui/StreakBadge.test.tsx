import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { STREAK_BADGE_LABELS } from "@/lib/streak/types";
import { childTid } from "@/lib/testIds";

const TID = "km.test.streak";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("StreakBadge", () => {
  it("renders the plural streak label for a multi-day streak", () => {
    render(<StreakBadge data-testid={TID} currentStreak={5} newlyEarnedBadge={null} onDismissBadge={vi.fn()} />);
    expect(screen.getByTestId(TID)).toHaveTextContent("5 ימים ברצף");
  });

  it("renders the singular label for a one-day streak", () => {
    render(<StreakBadge data-testid={TID} currentStreak={1} newlyEarnedBadge={null} onDismissBadge={vi.fn()} />);
    expect(screen.getByTestId(TID)).toHaveTextContent("יום 1 ברצף");
  });

  it("announces a newly earned badge in the live region", () => {
    render(
      <StreakBadge data-testid={TID} currentStreak={3} newlyEarnedBadge="streak_3" onDismissBadge={vi.fn()} />,
    );
    expect(screen.getByTestId(childTid(TID, "liveRegion"))).toHaveTextContent(STREAK_BADGE_LABELS.streak_3);
  });

  it("auto-dismisses a newly earned badge after 4s", () => {
    const onDismissBadge = vi.fn();
    render(
      <StreakBadge data-testid={TID} currentStreak={3} newlyEarnedBadge="streak_3" onDismissBadge={onDismissBadge} />,
    );
    expect(onDismissBadge).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismissBadge).toHaveBeenCalledOnce();
  });

  it("does not arm the dismiss timer when no badge was earned", () => {
    const onDismissBadge = vi.fn();
    render(<StreakBadge data-testid={TID} currentStreak={2} newlyEarnedBadge={null} onDismissBadge={onDismissBadge} />);
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismissBadge).not.toHaveBeenCalled();
  });
});
