import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { MetacognitionToast } from "@/components/ui/MetacognitionToast";
import { testIds } from "@/lib/testIds";

const ROOT = testIds.component.metacognitionToast.root();

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("MetacognitionToast", () => {
  it("renders nothing while not visible", () => {
    render(<MetacognitionToast visible={false} onDismiss={vi.fn()} />);
    expect(screen.queryByTestId(ROOT)).toBeNull();
  });

  it("shows a polite status toast when visible", () => {
    render(<MetacognitionToast visible onDismiss={vi.fn()} />);
    const toast = screen.getByTestId(ROOT);
    expect(toast).toHaveAttribute("role", "status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("auto-dismisses after 4s and calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(<MetacognitionToast visible onDismiss={onDismiss} />);
    expect(screen.getByTestId(ROOT)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4000));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByTestId(ROOT)).toBeNull();
  });
});
