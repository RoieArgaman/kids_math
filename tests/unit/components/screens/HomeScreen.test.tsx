import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { testIds } from "@/lib/testIds";

describe("HomeScreen", () => {
  it("renders the grade home with a day card grid after hydration", () => {
    render(<HomeScreen grade="a" />);
    // After the mount effect hydrates, the real home root (not the .loading variant) renders.
    expect(screen.getByTestId(testIds.screen.home.root("a"))).toBeInTheDocument();
  });
});
