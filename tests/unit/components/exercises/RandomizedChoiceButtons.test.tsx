import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RandomizedChoiceButtons } from "@/components/exercises/RandomizedChoiceButtons";
import type { ChoiceOption } from "@/lib/utils/choiceOptions";
import { childTid, testIds } from "@/lib/testIds";

const EX = "day-1-section-1-exercise-1";
const options: ChoiceOption[] = [
  { key: "a", value: "1", label: "1" },
  { key: "b", value: "2", label: "2 + 3" },
];

describe("RandomizedChoiceButtons", () => {
  it("renders every option (order-independent, keyed by option key)", () => {
    render(<RandomizedChoiceButtons exerciseId={EX} options={options} selected="" onSelect={vi.fn()} />);
    expect(screen.getByTestId(testIds.component.exerciseBox.choice(EX, "a"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.component.exerciseBox.choice(EX, "b"))).toBeInTheDocument();
  });

  it("wraps a math-expression label in an LTR-isolated span", () => {
    render(<RandomizedChoiceButtons exerciseId={EX} options={options} selected="" onSelect={vi.fn()} />);
    const mathLabel = screen.getByTestId(testIds.component.mathLabel(EX, "b"));
    expect(mathLabel).toHaveAttribute("dir", "ltr");
    expect(mathLabel).toHaveTextContent("2 + 3");
  });

  it("marks the selected option and reports the value on click", async () => {
    const onSelect = vi.fn();
    render(<RandomizedChoiceButtons exerciseId={EX} options={options} selected="1" onSelect={onSelect} />);
    expect(
      screen.getByTestId(childTid(testIds.component.exerciseBox.root(EX), "choice", "a", "selected")),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByTestId(testIds.component.exerciseBox.choice(EX, "b")));
    expect(onSelect).toHaveBeenCalledWith("2");
  });
});
