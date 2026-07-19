import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppNavLink } from "@/components/ui/AppNavLink";

describe("AppNavLink", () => {
  it("renders an anchor to href with the default tone", () => {
    render(<AppNavLink href="/math" data-testid="nav">Math</AppNavLink>);
    const link = screen.getByTestId("nav");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/math");
    expect(link).toHaveClass("text-violet-700");
  });

  it("maps the tone prop to its colour classes", () => {
    const { rerender } = render(<AppNavLink href="/x" data-testid="nav" tone="muted">x</AppNavLink>);
    expect(screen.getByTestId("nav")).toHaveClass("text-[var(--muted)]");
    rerender(<AppNavLink href="/x" data-testid="nav" tone="primary">x</AppNavLink>);
    expect(screen.getByTestId("nav")).toHaveClass("text-[var(--accent-strong)]");
  });

  it("keeps the shared base classes and appends a custom className", () => {
    render(<AppNavLink href="/x" data-testid="nav" className="mt-2">x</AppNavLink>);
    const link = screen.getByTestId("nav");
    expect(link).toHaveClass("mt-2");
    expect(link).toHaveClass("inline-flex");
  });
});
