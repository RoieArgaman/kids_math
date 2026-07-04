import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import type { Exercise } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

vi.mock("@/lib/hooks/useAdminTtsEnabled", () => ({
  useAdminTtsEnabled: () => ({ ttsEnabled: false, hydrated: true }),
}));
vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  autoSpeakHebrew: vi.fn(),
  autoSpeakHebrewChunks: vi.fn(),
  unlockAudioPlayback: vi.fn(),
  isAudioPlaybackUnlocked: vi.fn(() => false),
  stopSpeech: vi.fn(),
}));

const SCREEN = "km.test.screen";
const EX = "day-1-section-1-exercise-1";
const meta = { skillTags: [], difficulty: 1, representation: "abstract" } as const;
const exercise = { id: EX, kind: "number_input", prompt: "2+2", answer: 4, meta } as Exercise;

const handlers = {
  setFocusRef: vi.fn(),
  onChangeValue: vi.fn(),
  onSubmitExercise: vi.fn(),
  onNextInput: vi.fn(),
  onRetryExercise: vi.fn(),
  onRevealHint: vi.fn(),
};

describe("ExerciseItem", () => {
  it("wraps the ExerciseBox under a per-exercise wrapper testid", () => {
    render(
      <ExerciseItem screenRootTestId={SCREEN} exercise={exercise} value="" wasChecked={false} wrongAttempts={0} hintUsed={false} {...handlers} />,
    );
    expect(screen.getByTestId(childTid(SCREEN, "exerciseWrap", EX))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.input(EX))).toBeInTheDocument();
  });

  it("routes value changes back through onChangeValue with the exercise id", async () => {
    const onChangeValue = vi.fn();
    render(
      <ExerciseItem
        screenRootTestId={SCREEN}
        exercise={exercise}
        value=""
        wasChecked={false}
        wrongAttempts={0}
        hintUsed={false}
        {...handlers}
        onChangeValue={onChangeValue}
      />,
    );
    await userEvent.type(screen.getByTestId(testIds.component.exerciseBox.input(EX)), "4");
    expect(onChangeValue).toHaveBeenCalledWith(EX, "4");
  });

  it("does not propagate edits when read-only", async () => {
    const onChangeValue = vi.fn();
    render(
      <ExerciseItem
        screenRootTestId={SCREEN}
        exercise={exercise}
        value=""
        wasChecked={false}
        wrongAttempts={0}
        hintUsed={false}
        isReadOnly
        {...handlers}
        onChangeValue={onChangeValue}
      />,
    );
    await userEvent.type(screen.getByTestId(testIds.component.exerciseBox.input(EX)), "4");
    expect(onChangeValue).not.toHaveBeenCalled();
  });
});
