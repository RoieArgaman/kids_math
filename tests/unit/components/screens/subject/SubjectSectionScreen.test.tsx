import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubjectSectionScreen } from "@/components/screens/subject/SubjectSectionScreen";
import { englishScreenConfig as cfg } from "@/lib/subjects/subjectScreenConfig";
import type { DayId, SectionId } from "@/lib/types";

vi.mock("@/lib/hooks/useProgress", () => ({
  useProgress: () => ({
    setAnswer: vi.fn(),
    percentDone: 0,
    sectionWrongCount: 0,
    correctAnswers: {},
    resetSection: vi.fn(),
  }),
}));
vi.mock("@/lib/hooks/useDayAnswers", () => ({
  useDayAnswers: () => ({
    answers: {},
    correctMap: {},
    feedback: {},
    attempts: {},
    wrongAttempts: {},
    hintUsed: {},
    resetAnswerStateForExerciseIds: vi.fn(),
    onChangeValue: vi.fn(),
    onRetryExercise: vi.fn(),
    onRevealHint: vi.fn(),
    submitExercise: vi.fn(),
  }),
}));
vi.mock("@/lib/hooks/useSectionReset", () => ({ useSectionReset: () => ({ resetNotice: null }) }));
vi.mock("@/lib/hooks/useExerciseFocus", () => ({
  useExerciseFocus: () => ({ focusNextInput: vi.fn(), setFocusRef: vi.fn() }),
}));

describe("SubjectSectionScreen", () => {
  it("shows a not-found panel for an unknown day/section", () => {
    render(
      <SubjectSectionScreen
        config={cfg}
        level={cfg.levels[0]!}
        dayId={"day-99999" as DayId}
        sectionId={"day-99999-section-0" as SectionId}
      />,
    );
    expect(
      screen.getByTestId(cfg.section.testIds.root("day-99999", "day-99999-section-0.not-found")),
    ).toBeInTheDocument();
  });
});
