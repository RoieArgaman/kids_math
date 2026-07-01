import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BadgeGalleryScreen } from "@/components/screens/BadgeGalleryScreen";
import { testIds } from "@/lib/testIds";

describe("BadgeGalleryScreen", () => {
  it("renders the badge gallery for the grade after hydration", () => {
    render(<BadgeGalleryScreen grade="a" />);
    expect(screen.getByTestId(testIds.screen.badges.root("a"))).toBeInTheDocument();
  });
});
