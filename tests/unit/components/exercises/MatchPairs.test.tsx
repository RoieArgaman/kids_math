import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchPairs } from "@/components/exercises/MatchPairs";
import type { MatchPairsExercise } from "@/lib/types";
import { childTid, testIds } from "@/lib/testIds";

const EX = "day-1-section-1-exercise-1";
const exercise = {
  id: EX,
  kind: "match_pairs",
  prompt: "match",
  pairs: [
    { left: "cat", right: "חתול" },
    { left: "dog", right: "כלב" },
  ],
  leftLang: "en",
  rightLang: "he",
  meta: { skillTags: [], difficulty: 1, representation: "abstract" },
} as unknown as MatchPairsExercise;

const root = childTid(testIds.component.exerciseBox.root(EX), "matchPairs");

describe("MatchPairs", () => {
  it("renders both columns with a button per item", () => {
    render(<MatchPairs exercise={exercise} value="" onChange={vi.fn()} />);
    expect(screen.getByTestId(childTid(root, "leftCol"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.matchLeft(EX, 0))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.matchRight(EX, 1))).toBeInTheDocument();
  });

  it("emits a one-entry JSON mapping after selecting a left then a right", async () => {
    const onChange = vi.fn();
    render(<MatchPairs exercise={exercise} value="" onChange={onChange} />);
    // Tapping a left only sets local active state — no onChange yet.
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.matchLeft(EX, 0)));
    expect(onChange).not.toHaveBeenCalled();
    // Tapping a right commits the pair.
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.matchRight(EX, 0)));
    expect(onChange).toHaveBeenCalledOnce();
    const mapping = JSON.parse(onChange.mock.calls[0][0] as string) as Record<string, string>;
    expect(Object.keys(mapping)).toHaveLength(1);
  });
});
