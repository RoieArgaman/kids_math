import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LetterTiles } from "@/components/exercises/LetterTiles";
import type { LetterTilesExercise } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

const EX = "day-1-section-1-exercise-1";
// Fixed `tiles` so the order is deterministic (no shuffle).
const exercise = {
  id: EX,
  kind: "letter_tiles",
  prompt: "spell",
  word: "cat",
  tiles: ["c", "a", "t"],
  meta: { skillTags: [], difficulty: 1, representation: "abstract" },
} as unknown as LetterTilesExercise;

describe("LetterTiles", () => {
  it("shows a placeholder when nothing is assembled yet", () => {
    render(<LetterTiles exercise={exercise} value="" onChange={vi.fn()} />);
    expect(
      screen.getByTestId(childTid(testIds.component.exerciseBox.tileWord(EX), "placeholder")),
    ).toBeInTheDocument();
  });

  it("appends the tapped tile to the assembled value", async () => {
    const onChange = vi.fn();
    render(<LetterTiles exercise={exercise} value="" onChange={onChange} />);
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.tile(EX, 0)));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("disables backspace when empty and pops the last letter otherwise", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<LetterTiles exercise={exercise} value="" onChange={onChange} />);
    expect(screen.getByTestId(testIds.component.exerciseBox.tileBackspace(EX))).toBeDisabled();

    rerender(<LetterTiles exercise={exercise} value="ca" onChange={onChange} />);
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.tileBackspace(EX)));
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("disables a tile once it is consumed by the current value", () => {
    render(<LetterTiles exercise={exercise} value="c" onChange={vi.fn()} />);
    // "c" is index 0 and is now used.
    expect(screen.getByTestId(testIds.component.exerciseBox.tile(EX, 0))).toBeDisabled();
    expect(screen.getByTestId(testIds.component.exerciseBox.tile(EX, 1))).toBeEnabled();
  });
});
