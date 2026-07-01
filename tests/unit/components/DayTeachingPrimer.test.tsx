import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DayTeachingPrimer } from "@/components/teaching-primer/DayTeachingPrimer";
import { DayTeachingPrimer as ReExported } from "@/components/DayTeachingPrimer";
import type { WorkbookDay } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

vi.mock("@/components/providers/AdminTtsProvider", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: false, hydrated: true }),
}));
vi.mock("@/components/providers/StudentTtsProvider", () => ({
  useStudentTts: () => ({ autoPlay: false, setAutoPlay: vi.fn(), hydrated: true }),
}));
vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  stopSpeech: vi.fn(),
}));

const root = testIds.screen.dayOverview.teachingPrimer("a", "day-1");

function makeDay(overrides: Partial<WorkbookDay> = {}): WorkbookDay {
  return {
    id: "day-1",
    dayNumber: 1,
    week: 1,
    title: "יום",
    objective: "מטרה",
    teachingSummary: "הסבר קצר לפני שמתחילים",
    teachingSteps: ["צעד ראשון", "צעד שני"],
    ...overrides,
  } as unknown as WorkbookDay;
}

describe("DayTeachingPrimer", () => {
  it("renders the primer heading and summary when the day has teaching content", () => {
    render(<DayTeachingPrimer day={makeDay()} grade="a" dayId="day-1" />);
    expect(screen.getByTestId(childTid(root, "title"))).toHaveTextContent("לִפְנֵי שֶׁמַּתְחִילִים");
    expect(screen.getByTestId(childTid(root, "summary"))).toHaveTextContent("הסבר קצר");
  });

  it("renders nothing when the day has no teaching primer", () => {
    render(<DayTeachingPrimer day={makeDay({ teachingSummary: "", teachingSteps: [] })} grade="a" dayId="day-1" />);
    expect(screen.queryByTestId(root)).toBeNull();
  });

  it("is the same component that the top-level module re-exports", () => {
    expect(ReExported).toBe(DayTeachingPrimer);
  });
});
