import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackLink } from "@/components/ui/BackLink";

describe("BackLink", () => {
  it("renders a ButtonLink anchor to href with its children", () => {
    render(<BackLink href="/grade/a" data-testid="back">חזרה</BackLink>);
    const link = screen.getByTestId("back");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/grade/a");
    expect(link).toHaveTextContent("חזרה");
    // Inherits the ButtonLink styling.
    expect(link).toHaveClass("touch-button");
  });

  it("passes ButtonLink props (variant) through", () => {
    render(<BackLink href="/x" data-testid="back" variant="outline">חזרה</BackLink>);
    expect(screen.getByTestId("back")).toHaveClass("text-[var(--accent-strong)]");
  });
});
