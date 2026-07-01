import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { DayId, SectionId } from "@/lib/types";
import { englishScreenConfig } from "@/lib/subjects/subjectScreenConfig";
import { SubjectLevelPickerScreen } from "@/components/screens/subject/SubjectLevelPickerScreen";
import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";
import { SubjectDayScreen } from "@/components/screens/subject/SubjectDayScreen";
import { SubjectSectionScreen } from "@/components/screens/subject/SubjectSectionScreen";
import { SubjectFinalExamScreen } from "@/components/screens/subject/SubjectFinalExamScreen";
import { EnglishLevelPickerScreen } from "@/components/screens/english/EnglishLevelPickerScreen";
import { EnglishHomeScreen } from "@/components/screens/english/EnglishHomeScreen";
import { EnglishDayScreen } from "@/components/screens/english/EnglishDayScreen";
import { EnglishSectionScreen } from "@/components/screens/english/EnglishSectionScreen";
import { EnglishFinalExamScreen } from "@/components/screens/english/EnglishFinalExamScreen";

vi.mock("@/components/screens/subject/SubjectLevelPickerScreen", () => ({ SubjectLevelPickerScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectHomeScreen", () => ({ SubjectHomeScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectDayScreen", () => ({ SubjectDayScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectSectionScreen", () => ({ SubjectSectionScreen: vi.fn(() => null) }));
vi.mock("@/components/screens/subject/SubjectFinalExamScreen", () => ({ SubjectFinalExamScreen: vi.fn(() => null) }));

const props = (i: number) => vi.mocked([SubjectLevelPickerScreen, SubjectHomeScreen, SubjectDayScreen, SubjectSectionScreen, SubjectFinalExamScreen][i]).mock.calls[0][0];

beforeEach(() => vi.clearAllMocks());

describe("English screens delegate to the shared subject screens with the English config", () => {
  it("level picker", () => {
    render(<EnglishLevelPickerScreen />);
    expect(vi.mocked(SubjectLevelPickerScreen).mock.calls[0][0]).toMatchObject({ config: englishScreenConfig });
  });

  it("home", () => {
    render(<EnglishHomeScreen level="a" />);
    expect(vi.mocked(SubjectHomeScreen).mock.calls[0][0]).toMatchObject({ config: englishScreenConfig, level: "a" });
  });

  it("day", () => {
    render(<EnglishDayScreen level="a" dayId={"day-1" as DayId} />);
    expect(vi.mocked(SubjectDayScreen).mock.calls[0][0]).toMatchObject({ config: englishScreenConfig, level: "a", dayId: "day-1" });
  });

  it("section", () => {
    render(<EnglishSectionScreen level="b" dayId={"day-1" as DayId} sectionId={"day-1-section-0" as SectionId} />);
    expect(vi.mocked(SubjectSectionScreen).mock.calls[0][0]).toMatchObject({
      config: englishScreenConfig,
      level: "b",
      dayId: "day-1",
      sectionId: "day-1-section-0",
    });
  });

  it("final exam", () => {
    render(<EnglishFinalExamScreen level="a" />);
    expect(vi.mocked(SubjectFinalExamScreen).mock.calls[0][0]).toMatchObject({ config: englishScreenConfig, level: "a" });
  });

  it("uses one shared subject config object across all English hops", () => {
    render(<EnglishLevelPickerScreen />);
    render(<EnglishHomeScreen level="a" />);
    expect(props(0).config).toBe(props(1).config);
  });
});
