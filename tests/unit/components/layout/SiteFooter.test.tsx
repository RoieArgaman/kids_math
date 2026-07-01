import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { testIds } from "@/lib/testIds";

describe("SiteFooter", () => {
  it("renders the family info heading and legal links to the right routes", () => {
    render(<SiteFooter />);
    expect(screen.getByTestId(testIds.layout.siteFooter.heading())).toHaveTextContent("מידע למשפחה");
    expect(screen.getByTestId(testIds.layout.siteFooter.linkPrivacy())).toHaveAttribute("href", "/privacy");
    expect(screen.getByTestId(testIds.layout.siteFooter.linkCookies())).toHaveAttribute("href", "/cookies");
  });
});
