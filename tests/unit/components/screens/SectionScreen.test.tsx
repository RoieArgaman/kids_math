import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionScreen } from "@/components/screens/SectionScreen";
import type { DayId, SectionId } from "@/lib/types";
import { testIds } from "@/lib/testIds";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
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
vi.mock("@/lib/hooks/useDayUnlockStatus", () => ({
  useDayUnlockStatus: () => ({ previewAll: false, isRouteReady: true, isLocked: false }),
}));

describe("SectionScreen", () => {
  it("shows a not-found panel for an unknown day/section", () => {
    render(
      <SectionScreen grade="a" dayId={"day-99999" as DayId} sectionId={"day-99999-section-0" as SectionId} />,
    );
    expect(
      screen.getByTestId(testIds.screen.section.root("a", "day-99999", "day-99999-section-0.not-found")),
    ).toBeInTheDocument();
  });
});
