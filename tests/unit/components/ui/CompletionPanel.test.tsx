import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompletionPanel } from "@/components/ui/CompletionPanel";
import { childTid } from "@/lib/testIds";

const TID = "km.test.completion";

describe("CompletionPanel", () => {
  it("renders icon, title, subtitle and actions under the base testid", () => {
    render(
      <CompletionPanel
        data-testid={TID}
        icon="🏆"
        title="כל הכבוד"
        subtitle="סיימת את היום"
        actions={<button data-testid={childTid(TID, "actions", "next")}>הבא</button>}
      />,
    );
    expect(screen.getByTestId(childTid(TID, "icon"))).toHaveTextContent("🏆");
    expect(screen.getByTestId(childTid(TID, "title"))).toHaveTextContent("כל הכבוד");
    expect(screen.getByTestId(childTid(TID, "subtitle"))).toHaveTextContent("סיימת את היום");
    expect(screen.getByTestId(childTid(TID, "actions", "next"))).toBeInTheDocument();
  });

  it("applies custom icon/title sizing classes when overridden", () => {
    render(
      <CompletionPanel
        data-testid={TID}
        icon="✅"
        iconClassName="text-3xl"
        title="T"
        titleClassName="text-lg"
        subtitle="S"
        actions={null}
      />,
    );
    expect(screen.getByTestId(childTid(TID, "icon"))).toHaveClass("text-3xl");
    expect(screen.getByTestId(childTid(TID, "title"))).toHaveClass("text-lg");
  });
});
