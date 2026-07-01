import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonScreen } from "@/components/screens/ComingSoonScreen";
import { testIds } from "@/lib/testIds";

describe("ComingSoonScreen", () => {
  it("renders the coming-soon panel with CTAs to grade A and the grade picker", () => {
    render(<ComingSoonScreen grade="b" />);
    // After hydration (effect) the real panel renders.
    expect(screen.getByTestId(testIds.screen.comingSoon.root("b"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.comingSoon.ctaStartGradeA())).toHaveAttribute("href", "/grade/a");
    expect(screen.getByTestId(testIds.screen.comingSoon.ctaGradePicker())).toHaveAttribute("href", "/math");
  });
});
