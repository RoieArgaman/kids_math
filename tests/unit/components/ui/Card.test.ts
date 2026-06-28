import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActionCard, Card } from "@/components/ui/Card";

describe("Card", () => {
  it("forwards data-testid and renders children", () => {
    const html = renderToStaticMarkup(
      createElement(Card, { "data-testid": "km.test.card" }, "hello"),
    );
    expect(html).toContain('data-testid="km.test.card"');
    expect(html).toContain("hello");
  });

  it("applies the md padding token by default", () => {
    const html = renderToStaticMarkup(createElement(Card, {}, "x"));
    expect(html).toContain("p-5");
  });

  it("maps padding tokens to canonical classes", () => {
    expect(renderToStaticMarkup(createElement(Card, { padding: "sm" }, "x"))).toContain("p-4");
    expect(renderToStaticMarkup(createElement(Card, { padding: "lg" }, "x"))).toContain("p-6");
  });

  it("wraps children in a body div when bodyClassName is given", () => {
    const html = renderToStaticMarkup(
      createElement(Card, { bodyClassName: "space-y-2" }, "x"),
    );
    expect(html).toContain("space-y-2");
  });
});

describe("ActionCard", () => {
  it("renders the card testid and the cta testid + label", () => {
    const html = renderToStaticMarkup(
      createElement(ActionCard, {
        "data-testid": "km.test.actionCard",
        title: "Title",
        subtitle: "Sub",
        emoji: "🛠️",
        cta: { href: "/go", label: "Open", "data-testid": "km.test.actionCard.cta" },
      }),
    );
    expect(html).toContain('data-testid="km.test.actionCard"');
    expect(html).toContain('data-testid="km.test.actionCard.cta"');
    expect(html).toContain("Open");
    expect(html).toContain("Title");
    expect(html).toContain("Sub");
    expect(html).toContain("🛠️");
    // CTA is full-width, centered, with the canonical mt-5 gap.
    expect(html).toContain("mt-5");
    expect(html).toContain("w-full");
    expect(html).toContain('href="/go"');
  });

  it("forwards inner testids so adopting screens keep their exact ids", () => {
    const html = renderToStaticMarkup(
      createElement(ActionCard, {
        title: "T",
        emoji: "📊",
        bodyTestId: "km.body",
        emojiTestId: "km.emoji",
        titleTestId: "km.title",
        cta: { href: "/x", label: "Go" },
      }),
    );
    expect(html).toContain('data-testid="km.body"');
    expect(html).toContain('data-testid="km.emoji"');
    expect(html).toContain('data-testid="km.title"');
  });
});
