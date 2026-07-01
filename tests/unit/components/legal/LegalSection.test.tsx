import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalSection } from "@/components/legal/LegalSection";
import { childTid } from "@/lib/testIds";

const ROOT = "km.test.legal";
const base = childTid(ROOT, "section", "intro");

describe("LegalSection", () => {
  it("renders the heading, paragraphs, list items and footer", () => {
    render(
      <LegalSection
        rootTestId={ROOT}
        sectionKey="intro"
        title="מבוא"
        paragraphs={["פסקה ראשונה", "פסקה שנייה"]}
        listItems={["פריט א", "פריט ב"]}
        footer={<span data-testid={childTid(base, "footer", "inner")}>footer</span>}
      />,
    );
    expect(screen.getByTestId(childTid(base, "heading"))).toHaveTextContent("מבוא");
    expect(screen.getByTestId(childTid(base, "p", 0))).toHaveTextContent("פסקה ראשונה");
    expect(screen.getByTestId(childTid(base, "p", 1))).toHaveTextContent("פסקה שנייה");
    expect(screen.getByTestId(childTid(base, "li", 1))).toHaveTextContent("פריט ב");
    expect(screen.getByTestId(childTid(base, "footer", "inner"))).toBeInTheDocument();
  });

  it("omits the list when no listItems are given", () => {
    render(<LegalSection rootTestId={ROOT} sectionKey="intro" title="T" paragraphs={["x"]} />);
    expect(screen.queryByTestId(childTid(base, "ul"))).toBeNull();
  });
});
