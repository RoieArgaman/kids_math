import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinInput } from "@/components/ui/PinInput";

const testIds = {
  label: "km.test.pin.label",
  input: "km.test.pin.input",
  error: "km.test.pin.error",
  submit: "km.test.pin.submit",
};

function renderPin(overrides: Partial<ComponentProps<typeof PinInput>> = {}) {
  const props = {
    id: "pin",
    value: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    label: "קוד",
    submitLabel: "כניסה",
    testIds,
    ...overrides,
  };
  render(<PinInput {...props} />);
  return props;
}

describe("PinInput", () => {
  it("renders a numeric, LTR password field bound to the label", () => {
    renderPin();
    const input = screen.getByTestId(testIds.input);
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("dir", "ltr");
    expect(screen.getByTestId(testIds.label)).toHaveAttribute("for", "pin");
  });

  it("calls onChange as the user types", async () => {
    const props = renderPin();
    await userEvent.type(screen.getByTestId(testIds.input), "1");
    expect(props.onChange).toHaveBeenCalledWith("1");
  });

  it("submits on Enter and on the submit button", async () => {
    const props = renderPin();
    await userEvent.type(screen.getByTestId(testIds.input), "{Enter}");
    await userEvent.click(screen.getByTestId(testIds.submit));
    expect(props.onSubmit).toHaveBeenCalledTimes(2);
  });

  it("shows the error and wires aria-invalid / aria-describedby only when present", () => {
    const { rerender } = render(
      <PinInput id="pin" value="" onChange={vi.fn()} onSubmit={vi.fn()} label="קוד" submitLabel="כניסה" testIds={testIds} />,
    );
    expect(screen.getByTestId(testIds.input)).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByTestId(testIds.error)).toBeNull();

    rerender(
      <PinInput id="pin" value="" onChange={vi.fn()} onSubmit={vi.fn()} label="קוד" submitLabel="כניסה" testIds={testIds} error="קוד שגוי" />,
    );
    expect(screen.getByTestId(testIds.error)).toHaveTextContent("קוד שגוי");
    expect(screen.getByTestId(testIds.input)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId(testIds.input)).toHaveAttribute("aria-describedby", "pin-error");
  });
});
