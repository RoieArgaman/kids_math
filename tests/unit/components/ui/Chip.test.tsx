import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Chip } from "@/components/ui/Chip";
import { childTid } from "@/lib/testIds";

describe("Chip", () => {
  it("wraps children in an inner text span keyed off the base testid", () => {
    render(<Chip data-testid="km.test.chip">7 days</Chip>);
    expect(screen.getByTestId("km.test.chip")).toBeInTheDocument();
    expect(screen.getByTestId(childTid("km.test.chip", "text"))).toHaveTextContent("7 days");
  });

  it("defaults to the neutral tone", () => {
    render(<Chip data-testid="c">x</Chip>);
    expect(screen.getByTestId("c")).toHaveClass("bg-[#f3effb]");
  });

  it("maps explicit tones to their classes", () => {
    const { rerender } = render(<Chip data-testid="c" tone="danger">x</Chip>);
    expect(screen.getByTestId("c")).toHaveClass("text-[#dc2626]");
    rerender(<Chip data-testid="c" tone="success">x</Chip>);
    expect(screen.getByTestId("c")).toHaveClass("text-[#047857]");
  });

  it("forwards aria-label onto the outer span", () => {
    render(<Chip data-testid="c" aria-label="streak">🔥</Chip>);
    expect(screen.getByTestId("c")).toHaveAttribute("aria-label", "streak");
  });
});
