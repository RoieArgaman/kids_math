import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NumberLine } from "@/components/NumberLine";

describe("NumberLine", () => {
  it("renders one tick per integer in an LTR track", () => {
    render(<NumberLine start={2} end={6} />);
    expect(screen.getByTestId("km.autogen.numberline.node.idx.0")).toHaveAttribute("dir", "ltr");
    const labels = screen.getAllByTestId("km.autogen.numberline.node.idx.5");
    expect(labels.map((l) => l.textContent)).toEqual(["2", "3", "4", "5", "6"]);
  });

  it("normalizes a reversed range (end < start)", () => {
    render(<NumberLine start={5} end={3} />);
    const labels = screen.getAllByTestId("km.autogen.numberline.node.idx.5");
    expect(labels.map((l) => l.textContent)).toEqual(["3", "4", "5"]);
  });
});
