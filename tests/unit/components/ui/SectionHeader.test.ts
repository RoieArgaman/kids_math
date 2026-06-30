import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectionHeader } from "@/components/ui/SectionHeader";

describe("SectionHeader", () => {
  it("renders title and subtitle with child testids", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeader, {
        "data-testid": "km.header",
        title: "Title",
        subtitle: "Sub",
      }),
    );
    expect(html).toContain('data-testid="km.header"');
    expect(html).toContain('data-testid="km.header.el.title"');
    expect(html).toContain('data-testid="km.header.el.subtitle"');
    expect(html).toContain("Title");
    expect(html).toContain("Sub");
    expect(html).toContain("mb-4");
    expect(html).toContain("text-center");
    expect(html).toContain("mt-1");
  });

  it("omits subtitle node when not provided", () => {
    const html = renderToStaticMarkup(
      createElement(SectionHeader, { "data-testid": "km.header", title: "Only" }),
    );
    expect(html).not.toContain("km.header.el.subtitle");
  });

  it("supports right alignment", () => {
    const html = renderToStaticMarkup(createElement(SectionHeader, { title: "T", align: "right" }));
    expect(html).toContain("text-right");
  });
});
