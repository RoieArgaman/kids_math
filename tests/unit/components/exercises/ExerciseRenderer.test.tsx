import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseRenderer } from "@/components/exercises/ExerciseRenderer";
import type { Exercise } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  stopSpeech: vi.fn(),
}));

const EX = "day-1-section-1-exercise-1";
const meta = { skillTags: [], difficulty: 1, representation: "abstract" } as const;
const BASE = testIds.component.exerciseBox.root(EX);

function renderKind(exercise: Exercise, onChange = vi.fn()) {
  render(
    <ExerciseRenderer exercise={exercise} value="" inputLabel="answer" baseTestId={BASE} onChange={onChange} onEnter={vi.fn()} />,
  );
  return onChange;
}

describe("ExerciseRenderer", () => {
  it("renders a numeric input for number_input and reports typed value", async () => {
    const onChange = renderKind({ id: EX, kind: "number_input", prompt: "2+2", answer: 4, meta } as Exercise);
    const input = screen.getByTestId(testIds.component.exerciseBox.input(EX));
    expect(input).toHaveAttribute("type", "number");
    await userEvent.type(input, "4");
    expect(onChange).toHaveBeenCalledWith("4");
  });

  it("renders choice buttons for multiple_choice", () => {
    renderKind({ id: EX, kind: "multiple_choice", prompt: "pick", options: ["1", "2", "3"], answer: "1", meta } as Exercise);
    expect(screen.getByTestId(childTid(BASE, "choices"))).toBeInTheDocument();
  });

  it("renders the tap-to-build tray for letter_tiles", () => {
    renderKind({ id: EX, kind: "letter_tiles", prompt: "spell", word: "cat", tiles: ["c", "a", "t"], meta } as unknown as Exercise);
    expect(screen.getByTestId(childTid(BASE, "letterTiles"))).toBeInTheDocument();
  });

  it("renders a number line plus input for number_line_jump", () => {
    renderKind({ id: EX, kind: "number_line_jump", prompt: "jump", start: 0, end: 5, answer: 3, meta } as unknown as Exercise);
    expect(screen.getByTestId(childTid(BASE, "number-line-jump"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.input(EX))).toBeInTheDocument();
  });
});
