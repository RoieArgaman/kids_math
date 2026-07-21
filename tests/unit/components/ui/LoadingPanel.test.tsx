import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";
import { testIds } from "@/lib/testIds";

describe("LoadingPanel", () => {
  it("renders the title", () => {
    render(<LoadingPanel title="טוען…" />);
    expect(screen.getByTestId(testIds.component.loadingPanel.title())).toHaveTextContent("טוען…");
  });

  it("renders the emoji only when provided", () => {
    const { rerender } = render(<LoadingPanel title="t" />);
    expect(screen.queryByTestId(testIds.component.loadingPanel.emoji())).toBeNull();
    rerender(<LoadingPanel title="t" emoji="⏳" />);
    expect(screen.getByTestId(testIds.component.loadingPanel.emoji())).toHaveTextContent("⏳");
  });

  it("appends a custom className to the default card class", () => {
    render(<LoadingPanel title="t" className="extra-class" />);
    const root = screen.getByTestId(testIds.component.loadingPanel.root());
    expect(root).toHaveClass("surface");
    expect(root).toHaveClass("extra-class");
  });
});
