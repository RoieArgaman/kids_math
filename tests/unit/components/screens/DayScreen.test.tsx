import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { DayScreen } from "@/components/screens/DayScreen";
import { DayOverviewScreen } from "@/components/screens/DayOverviewScreen";
import { FinalExamScreen } from "@/components/screens/FinalExamScreen";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";
import type { DayId } from "@/lib/types";

vi.mock("@/components/screens/DayOverviewScreen", () => ({
  DayOverviewScreen: vi.fn(() => null),
}));
vi.mock("@/components/screens/FinalExamScreen", () => ({
  FinalExamScreen: vi.fn(() => null),
}));

beforeEach(() => vi.clearAllMocks());

describe("DayScreen routing", () => {
  it("routes a normal day to the DayOverviewScreen", () => {
    render(<DayScreen grade="a" dayId={"day-3" as DayId} />);
    expect(vi.mocked(DayOverviewScreen).mock.calls[0][0]).toMatchObject({ grade: "a", dayId: "day-3" });
    expect(FinalExamScreen).not.toHaveBeenCalled();
  });

  it("routes the final-exam day id to the FinalExamScreen", () => {
    render(<DayScreen grade="b" dayId={FINAL_EXAM_DAY_ID} />);
    expect(vi.mocked(FinalExamScreen).mock.calls[0][0]).toMatchObject({ grade: "b" });
    expect(DayOverviewScreen).not.toHaveBeenCalled();
  });
});
