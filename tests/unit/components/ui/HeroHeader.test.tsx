import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroHeader } from "@/components/ui/HeroHeader";
import { childTid } from "@/lib/testIds";

const TID = "km.test.hero";

describe("HeroHeader", () => {
  it("renders the title and the default decoration set", () => {
    render(<HeroHeader data-testid={TID} title="שלום" />);
    expect(screen.getByTestId(childTid(TID, "title"))).toHaveTextContent("שלום");
    // Three default decorations are rendered as aria-hidden spans.
    expect(screen.getByTestId(childTid(TID, "decoration", 0))).toBeInTheDocument();
    expect(screen.getByTestId(childTid(TID, "decoration", 2))).toBeInTheDocument();
  });

  it("renders subtitle and actions only when provided", () => {
    const { rerender } = render(<HeroHeader data-testid={TID} title="T" />);
    expect(screen.queryByTestId(childTid(TID, "subtitle"))).toBeNull();
    expect(screen.queryByTestId(childTid(TID, "actions"))).toBeNull();

    rerender(<HeroHeader data-testid={TID} title="T" subtitle="Sub" actions={<span>go</span>} />);
    expect(screen.getByTestId(childTid(TID, "subtitle"))).toHaveTextContent("Sub");
    expect(screen.getByTestId(childTid(TID, "actions"))).toHaveTextContent("go");
  });

  it("renders a caller-supplied decoration list instead of the default", () => {
    render(<HeroHeader data-testid={TID} title="T" decorations={[{ emoji: "🌟", className: "x" }]} />);
    expect(screen.getByTestId(childTid(TID, "decoration", 0))).toHaveTextContent("🌟");
    expect(screen.queryByTestId(childTid(TID, "decoration", 1))).toBeNull();
  });
});
