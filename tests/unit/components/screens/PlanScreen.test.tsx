import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanScreen } from "@/components/screens/PlanScreen";
import { testIds } from "@/lib/testIds";

describe("PlanScreen", () => {
  it("renders the ministry curriculum plan after hydration", () => {
    render(<PlanScreen grade="a" />);
    expect(screen.getByTestId(testIds.screen.plan.root("a"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.plan.overall())).toBeInTheDocument();
  });
});
