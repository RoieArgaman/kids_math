import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayCard, type DayCardState } from "@/components/home/DayCard";
import type { WorkbookDay } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

vi.mock("@/lib/analytics/events", () => ({ logEvent: vi.fn() }));

const day = {
  id: "day-2",
  dayNumber: 2,
  week: 1,
  title: "מספרים",
  objective: "לספור עד 20",
} as unknown as WorkbookDay;

function renderCard(state: DayCardState, score = 0) {
  render(
    <DayCard
      day={day}
      state={state}
      score={score}
      effectiveGrade="a"
      previewAll={false}
      dayProgress={undefined}
      isFinalExamDay={false}
      finalExam={null}
    />,
  );
}

const root = testIds.screen.home.dayCard("day-2");

describe("DayCard", () => {
  it("shows the locked hint and no CTA when locked", () => {
    renderCard("locked");
    expect(screen.getByTestId(childTid(root, "stateChip"))).toHaveTextContent("נָעוּל");
    expect(screen.getByTestId(childTid(root, "lockedHint"))).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.screen.home.dayCardCta("day-2"))).toBeNull();
  });

  it("links into the day when open", () => {
    renderCard("open", 30);
    const cta = screen.getByTestId(testIds.screen.home.dayCardCta("day-2"));
    expect(cta).toHaveTextContent("כְּנִיסָה לַיּוֹם");
    expect(cta).toHaveAttribute("href", "/grade/a/day/day-2");
    expect(screen.getByTestId(childTid(root, "progressPercent"))).toHaveTextContent("30%");
  });

  it("shows the completed treatment and a back link when complete", () => {
    renderCard("complete", 100);
    expect(screen.getByTestId(childTid(root, "stateChip"))).toHaveTextContent("הוּשְׁלַם");
    expect(screen.getByTestId(testIds.screen.home.dayCardCta("day-2"))).toHaveTextContent("חֲזָרָה לַיּוֹם");
  });
});
