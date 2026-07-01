import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "@/components/ui/Field";

describe("Field", () => {
  it("renders a label bound to the control and the control itself", () => {
    render(
      <Field data-testid="km.test.field" label="PIN" htmlFor="pin" labelTestId="km.test.field.label">
        <input id="pin" data-testid="km.test.field.input" />
      </Field>,
    );
    const label = screen.getByTestId("km.test.field.label");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveTextContent("PIN");
    expect(label).toHaveAttribute("for", "pin");
    expect(screen.getByTestId("km.test.field.input")).toBeInTheDocument();
  });

  it("uses the mb-3 spacing by default and honours an override", () => {
    const { rerender } = render(
      <Field data-testid="f" label="L"><input /></Field>,
    );
    expect(screen.getByTestId("f")).toHaveClass("mb-3");
    rerender(
      <Field data-testid="f" label="L" className="mb-8"><input /></Field>,
    );
    expect(screen.getByTestId("f")).toHaveClass("mb-8");
    expect(screen.getByTestId("f")).not.toHaveClass("mb-3");
  });
});
