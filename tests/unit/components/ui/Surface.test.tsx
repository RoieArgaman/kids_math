import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Surface } from "@/components/ui/Surface";
import { childTid } from "@/lib/testIds";

describe("Surface", () => {
  it("renders children inside a content wrapper and applies the base class", () => {
    render(<Surface data-testid="km.test.surface">body</Surface>);
    expect(screen.getByTestId("km.test.surface")).toHaveClass("surface");
    expect(screen.getByTestId(childTid("km.test.surface", "content"))).toHaveTextContent("body");
  });

  it("adds the variant class only for non-default variants", () => {
    const { rerender } = render(<Surface data-testid="s" variant="success">x</Surface>);
    expect(screen.getByTestId("s")).toHaveClass("surface-success");
    rerender(<Surface data-testid="s" variant="error">x</Surface>);
    expect(screen.getByTestId("s")).toHaveClass("surface-error");
    rerender(<Surface data-testid="s">x</Surface>);
    expect(screen.getByTestId("s").className).toBe("surface");
  });
});
