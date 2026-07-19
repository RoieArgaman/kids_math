import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, ButtonLink } from "@/components/ui/Button";

describe("Button", () => {
  it("renders an accent button by default with the touch-button base", () => {
    render(<Button data-testid="b">Go</Button>);
    const btn = screen.getByTestId("b");
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveClass("touch-button");
    expect(btn).toHaveClass("btn-accent");
  });

  it("uses the outline variant classes when asked", () => {
    render(<Button data-testid="b" variant="outline">Go</Button>);
    expect(screen.getByTestId("b")).toHaveClass("text-[var(--accent-strong)]");
  });

  it("forces the disabled variant and disables the element when disabled", () => {
    render(<Button data-testid="b" variant="accent" disabled>Go</Button>);
    const btn = screen.getByTestId("b");
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass("btn-disabled");
    expect(btn).not.toHaveClass("btn-accent");
  });

  it("fires onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Button data-testid="b" onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByTestId("b"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick while disabled", async () => {
    const onClick = vi.fn();
    render(<Button data-testid="b" disabled onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByTestId("b"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("ButtonLink", () => {
  it("renders an anchor to href with the button styling", () => {
    render(<ButtonLink data-testid="l" href="/next">Go</ButtonLink>);
    const link = screen.getByTestId("l");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/next");
    expect(link).toHaveClass("touch-button");
    expect(link).toHaveClass("btn-accent");
  });
});
