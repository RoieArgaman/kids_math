import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ProgressBar";

const bar = () => screen.getByTestId("km.autogen.progressbar.node.idx.5");

describe("ProgressBar", () => {
  it("clamps and rounds the value into 0..100", () => {
    const { rerender } = render(<ProgressBar value={150} />);
    expect(bar()).toHaveAttribute("aria-valuenow", "100");
    rerender(<ProgressBar value={-20} />);
    expect(bar()).toHaveAttribute("aria-valuenow", "0");
    rerender(<ProgressBar value={49.6} />);
    expect(bar()).toHaveAttribute("aria-valuenow", "50");
  });

  it("shows the completion message and trophy at 100%", () => {
    render(<ProgressBar value={100} />);
    expect(screen.getByTestId("km.autogen.progressbar.node.idx.9")).toHaveTextContent("כָּל הַכָּבוֹד");
    expect(screen.getByTestId("km.autogen.progressbar.node.idx.8")).toHaveTextContent("🏆");
  });

  it("shows the mid ⭐ marker between 50 and 99 but not the completion message", () => {
    render(<ProgressBar value={60} />);
    expect(screen.getByTestId("km.autogen.progressbar.node.idx.7")).toHaveTextContent("⭐");
    expect(screen.queryByTestId("km.autogen.progressbar.node.idx.9")).toBeNull();
  });

  it("renders the compact variant without the card markers", () => {
    render(<ProgressBar value={40} compact />);
    expect(bar()).toHaveAttribute("aria-valuenow", "40");
    // The mid-marker / completion nodes only exist in the full variant.
    expect(screen.queryByTestId("km.autogen.progressbar.node.idx.7")).toBeNull();
  });
});
