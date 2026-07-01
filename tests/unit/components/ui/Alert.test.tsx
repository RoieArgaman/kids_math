import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  it("renders children and forwards the testid", () => {
    render(
      <Alert tone="info" data-testid="km.test.alert">
        heads up
      </Alert>,
    );
    const el = screen.getByTestId("km.test.alert");
    expect(el).toHaveTextContent("heads up");
    expect(el.tagName).toBe("P");
  });

  it("maps each tone to its tint classes", () => {
    const { rerender } = render(<Alert tone="info" data-testid="a">x</Alert>);
    expect(screen.getByTestId("a")).toHaveClass("text-[#3730a3]");
    rerender(<Alert tone="success" data-testid="a">x</Alert>);
    expect(screen.getByTestId("a")).toHaveClass("text-[#047857]");
    rerender(<Alert tone="error" data-testid="a">x</Alert>);
    expect(screen.getByTestId("a")).toHaveClass("text-[#b91c1c]");
  });

  it("appends a custom className while keeping the base classes", () => {
    render(<Alert tone="info" className="mt-4" data-testid="a">x</Alert>);
    const el = screen.getByTestId("a");
    expect(el).toHaveClass("mt-4");
    expect(el).toHaveClass("rounded-xl");
  });
});
