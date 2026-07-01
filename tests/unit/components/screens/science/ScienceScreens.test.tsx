import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { DayId, SectionId } from "@/lib/types";
import { scienceScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import { SubjectLevelPickerScreen } from "@/components/screens/subject/SubjectLevelPickerScreen";
import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";
import { SubjectDayScreen } from "@/components/screens/subject/SubjectDayScreen";
import { SubjectSectionScreen } from "@/components/screens/subject/SubjectSectionScreen";
import { SubjectFinalExamScreen } from "@/components/screens/subject/SubjectFinalExamScreen";
import { ScienceLevelPickerScreen } from "@/components/screens/science/ScienceLevelPickerScreen";
import { ScienceHomeScreen } from "@/components/screens/science/ScienceHomeScreen";
import { ScienceDayScreen } from "@/components/screens/science/ScienceDayScreen";
import { ScienceSectionScreen } from "@/components/screens/science/ScienceSectionScreen";
import { ScienceFinalExamScreen } from "@/components/screens/science/ScienceFinalExamScreen";

vi.mock("@/components/screens/subject/SubjectLevelPickerScreen", () => ({ SubjectLevelPickerScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectHomeScreen", () => ({ SubjectHomeScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectDayScreen", () => ({ SubjectDayScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectSectionScreen", () => ({ SubjectSectionScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectFinalExamScreen", () => ({ SubjectFinalExamScreen: vi.fn(() => null) }));

beforeEach(() => vi.clearAllMocks());

describe("Science screens delegate to the shared subject screens with the Science config", () => {
  it("level picker", () => {
    render(<ScienceLevelPickerScreen />);
    expect(vi.mocked(SubjectLevelPickerScreen).mock.calls[0][0]).toMatchObject({ config: scienceScreenConfig });
  });

  it("home", () => {
    render(<ScienceHomeScreen level="a" />);
    expect(vi.mocked(SubjectHomeScreen).mock.calls[0][0]).toMatchObject({ config: scienceScreenConfig, level: "a" });
  });

  it("day", () => {
    render(<ScienceDayScreen level="a" dayId={"day-1" as DayId} />);
    expect(vi.mocked(SubjectDayScreen).mock.calls[0][0]).toMatchObject({ config: scienceScreenConfig, level: "a", dayId: "day-1" });
  });

  it("section", () => {
    render(<ScienceSectionScreen level="b" dayId={"day-1" as DayId} sectionId={"day-1-section-0" as SectionId} />);
    expect(vi.mocked(SubjectSectionScreen).mock.calls[0][0]).toMatchObject({
      config: scienceScreenConfig,
      level: "b",
      dayId: "day-1",
      sectionId: "day-1-section-0",
    });
  });

  it("final exam", () => {
    render(<ScienceFinalExamScreen level="a" />);
    expect(vi.mocked(SubjectFinalExamScreen).mock.calls[0][0]).toMatchObject({ config: scienceScreenConfig, level: "a" });
  });
});
