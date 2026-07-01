import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Ltr } from "@/components/ui/Ltr";

describe("Ltr", () => {
  it("renders an LTR-directioned span around numerals inside an RTL view", () => {
    render(<Ltr data-testid="km.test.ltr">85%</Ltr>);
    const el = screen.getByTestId("km.test.ltr");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveAttribute("dir", "ltr");
    expect(el).toHaveTextContent("85%");
  });
});
