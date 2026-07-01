import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubjectLevelPickerScreen } from "@/components/screens/subject/SubjectLevelPickerScreen";
import { SubjectHomeScreen } from "@/components/screens/subject/SubjectHomeScreen";
import { SubjectDayScreen } from "@/components/screens/subject/SubjectDayScreen";
import { SubjectFinalExamScreen } from "@/components/screens/subject/SubjectFinalExamScreen";
import { englishScreenConfig as cfg } from "@/lib/subjects/subjectScreenConfig";
import type { DayId } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/hooks/useProgress", () => ({
  useProgress: () => ({ markComplete: vi.fn(() => false), percentDone: 0, correctAnswers: {} }),
}));

const firstLevel = cfg.levels[0]!;

describe("shared subject screens (English config)", () => {
  it("level picker renders the hero and a card for the first level", () => {
    render(<SubjectLevelPickerScreen config={cfg} />);
    expect(screen.getByTestId(cfg.levelPicker.testIds.root())).toBeInTheDocument();
    expect(screen.getByTestId(cfg.levelPicker.testIds.levelCard(firstLevel))).toBeInTheDocument();
  });

  it("home renders the lesson grid and the summary-exam card", () => {
    render(<SubjectHomeScreen config={cfg} level={firstLevel} />);
    expect(screen.getByTestId(cfg.home.testIds.root())).toBeInTheDocument();
    expect(screen.getByTestId(cfg.home.testIds.examCard())).toBeInTheDocument();
  });

  it("day screen shows a not-found panel for an unknown day id", () => {
    render(<SubjectDayScreen config={cfg} level={firstLevel} dayId={"day-99999" as DayId} />);
    expect(screen.getByTestId(cfg.day.testIds.root("day-99999.not-found"))).toBeInTheDocument();
  });

  it("final exam is locked until all lessons are complete", () => {
    render(<SubjectFinalExamScreen config={cfg} level={firstLevel} />);
    expect(screen.getByTestId(cfg.exam.testIds.root())).toBeInTheDocument();
    expect(screen.getByTestId(cfg.exam.testIds.lockedNotice())).toBeInTheDocument();
  });
});
