import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tile } from "@/components/ui/Tile";

describe("Tile", () => {
  it("renders root, value and label child testids", () => {
    const html = renderToStaticMarkup(
      createElement(Tile, { "data-testid": "km.tile", label: "Label", value: "42" }),
    );
    expect(html).toContain('data-testid="km.tile"');
    expect(html).toContain('data-testid="km.tile.el.value"');
    expect(html).toContain('data-testid="km.tile.el.label"');
    expect(html).toContain("42");
    expect(html).toContain("Label");
  });

  it("prefers children over value", () => {
    const html = renderToStaticMarkup(
      createElement(Tile, { "data-testid": "km.tile", label: "L", value: "ignored" }, "child"),
    );
    expect(html).toContain("child");
    expect(html).not.toContain("ignored");
  });

  it("default tone is the bordered white stat tile", () => {
    const html = renderToStaticMarkup(createElement(Tile, { label: "L", value: "1" }));
    expect(html).toContain("border border-[#e7defb]");
    expect(html).toContain("bg-white/70");
    expect(html).toContain("text-[var(--title)]");
  });

  it("colored tones reproduce CounterTile fills", () => {
    expect(renderToStaticMarkup(createElement(Tile, { label: "L", value: "1", tone: "success" }))).toContain(
      "bg-[#d1fae5]",
    );
    expect(renderToStaticMarkup(createElement(Tile, { label: "L", value: "1", tone: "warning" }))).toContain(
      "bg-[#fef3c7]",
    );
    expect(renderToStaticMarkup(createElement(Tile, { label: "L", value: "1", tone: "neutral" }))).toContain(
      "bg-[#f3effb]",
    );
  });
});
