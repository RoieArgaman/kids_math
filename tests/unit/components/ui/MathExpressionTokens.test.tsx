import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MathExpressionTokens } from "@/components/ui/MathExpressionTokens";
import type { MathExpressionToken } from "@/lib/utils/mathText";
import { childTid } from "@/lib/testIds";

const BASE = "km.test.mx";
const CONTAINER = childTid(BASE, "mathTokens");

const tokens: MathExpressionToken[] = [
  { type: "number", value: "7" },
  { type: "operator", value: "+" },
  { type: "number", value: "5" },
  { type: "equals", value: "=" },
  { type: "question", value: "?" },
];

describe("MathExpressionTokens", () => {
  it("renders an LTR-isolated container so math reads correctly inside RTL", () => {
    render(<MathExpressionTokens baseTestId={BASE} tokens={tokens} />);
    const container = screen.getByTestId(CONTAINER);
    expect(container).toHaveAttribute("dir", "ltr");
  });

  it("renders one span per token with a type-modifier class", () => {
    render(<MathExpressionTokens baseTestId={BASE} tokens={tokens} />);
    const first = screen.getByTestId(childTid(CONTAINER, "token", 0, "number"));
    expect(first).toHaveTextContent("7");
    expect(first).toHaveClass("km-math-token--number");
    expect(screen.getByTestId(childTid(CONTAINER, "token", 1, "operator"))).toHaveTextContent("+");
    expect(screen.getByTestId(childTid(CONTAINER, "token", 4, "question"))).toHaveTextContent("?");
  });

  it("renders nothing inside the container for an empty token list", () => {
    render(<MathExpressionTokens baseTestId={BASE} tokens={[]} />);
    expect(screen.getByTestId(CONTAINER).children).toHaveLength(0);
  });
});
