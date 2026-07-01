import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingPanel } from "@/components/ui/LoadingPanel";

describe("LoadingPanel", () => {
  it("renders the title", () => {
    render(<LoadingPanel title="טוען…" />);
    expect(screen.getByTestId("km.autogen.loadingpanel.node.idx.2")).toHaveTextContent("טוען…");
  });

  it("renders the emoji only when provided", () => {
    const { rerender } = render(<LoadingPanel title="t" />);
    expect(screen.queryByTestId("km.autogen.loadingpanel.node.idx.1")).toBeNull();
    rerender(<LoadingPanel title="t" emoji="⏳" />);
    expect(screen.getByTestId("km.autogen.loadingpanel.node.idx.1")).toHaveTextContent("⏳");
  });

  it("appends a custom className to the default card class", () => {
    render(<LoadingPanel title="t" className="extra-class" />);
    const root = screen.getByTestId("km.autogen.loadingpanel.node.idx.0");
    expect(root).toHaveClass("surface");
    expect(root).toHaveClass("extra-class");
  });
});
