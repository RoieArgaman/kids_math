import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayHeader } from "@/components/DayHeader";
import type { WorkbookDay } from "@/lib/types";
import { childTid } from "@/lib/testIds";

const day = {
  id: "day-3",
  dayNumber: 3,
  week: 1,
  title: "חיבור עד 10",
  objective: "לחבר מספרים",
} as unknown as WorkbookDay;

const ROOT = "km.test.dayheader";

describe("DayHeader", () => {
  it("renders the day title, week badge and objective", () => {
    render(<DayHeader day={day} rootTestId={ROOT} />);
    expect(screen.getByTestId(childTid(ROOT, "title"))).toHaveTextContent("יוֹם 3: חיבור עד 10");
    expect(screen.getByTestId(childTid(ROOT, "weekBadge"))).toHaveTextContent("שָׁבוּעַ 1");
    expect(screen.getByTestId(childTid(ROOT, "objective"))).toHaveTextContent("לחבר מספרים");
  });

  it("shows the session timer only when enabled with a finite value", () => {
    const { rerender } = render(<DayHeader day={day} rootTestId={ROOT} sessionTimerTestId="km.test.timer" />);
    expect(screen.queryByTestId("km.test.timer")).toBeNull();

    rerender(
      <DayHeader day={day} rootTestId={ROOT} showSessionTimer sessionTimerMs={65000} sessionTimerTestId="km.test.timer" />,
    );
    expect(screen.getByTestId("km.test.timer")).toHaveTextContent("⏱");
  });
});
