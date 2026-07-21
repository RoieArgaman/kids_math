import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExerciseRenderer } from "@/components/exercises/ExerciseRenderer";
import { generatedNumberLineJump } from "@/lib/content/engine/exercise-factories";
import { childTid, testIds } from "@/lib/testIds";

vi.mock("@/lib/tts/engine", () => ({
  isTtsSupported: vi.fn(() => true),
  isEnglishVoiceAvailable: vi.fn(() => true),
  speakHebrew: vi.fn(),
  speakEnglish: vi.fn(),
  speakHebrewChunks: vi.fn(),
  stopSpeech: vi.fn(),
}));

const ex = generatedNumberLineJump({
  grade: "b",
  dayNumber: 9,
  sectionNumber: 2,
  exerciseNumber: 5,
  seedSuffix: "focus",
  leadIn: "עַל קַו הַמִּסְפָּרִים: ",
  tags: ["number-line", "patterns"],
  difficulty: 3,
  representation: "abstract",
});
const BASE = testIds.component.exerciseBox.root(ex.id);

describe("ExerciseRenderer with a generated number_line_jump", () => {
  it("renders the number line with one tick per integer in range plus the input", async () => {
    const onChange = vi.fn();
    render(
      <ExerciseRenderer
        exercise={ex}
        value=""
        inputLabel="answer"
        baseTestId={BASE}
        onChange={onChange}
        onEnter={vi.fn()}
      />,
    );

    expect(screen.getByTestId(childTid(BASE, "number-line-jump"))).toBeInTheDocument();

    const labels = screen.getAllByTestId(testIds.component.numberLine.pointLabel());
    expect(labels).toHaveLength(ex.end - ex.start + 1);
    expect(labels[0].textContent).toBe(String(ex.start));
    expect(labels[labels.length - 1].textContent).toBe(String(ex.end));

    const input = screen.getByTestId(testIds.component.exerciseBox.input(ex.id));
    expect(input).toHaveAttribute("type", "number");
    await userEvent.type(input, String(ex.answer));
    expect(onChange).toHaveBeenCalledWith(String(ex.answer));
  });
});
