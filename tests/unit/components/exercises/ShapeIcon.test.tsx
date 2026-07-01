import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShapeIcon } from "@/components/exercises/ShapeIcon";
import { testIds } from "@/lib/testIds";

describe("ShapeIcon", () => {
  it("renders a labelled SVG for a known shape", () => {
    render(<ShapeIcon shape="triangle" />);
    const root = screen.getByTestId(testIds.component.shapeIcon.root("triangle"));
    expect(root).toHaveAttribute("role", "img");
    expect(root).toHaveAttribute("aria-label", "מְשֻׁלָּשׁ");
    expect(screen.getByTestId(testIds.component.shapeIcon.svg("triangle"))).toBeInTheDocument();
  });

  it("falls back to plain text for an unknown shape", () => {
    render(<ShapeIcon shape="hexagon" />);
    const fallback = screen.getByTestId(testIds.component.shapeIcon.fallback());
    expect(fallback).toHaveTextContent("hexagon");
  });
});
