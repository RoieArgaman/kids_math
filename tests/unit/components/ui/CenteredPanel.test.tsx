import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CenteredPanel } from "@/components/ui/CenteredPanel";
import { childTid } from "@/lib/testIds";

const TID = "km.test.panel";

describe("CenteredPanel", () => {
  it("renders title, description, emoji and actions when all are provided", () => {
    render(
      <CenteredPanel
        data-testid={TID}
        emoji="🎉"
        title="Done"
        description="You finished"
        actions={<button data-testid={childTid(TID, "actions", "cta")}>Next</button>}
      />,
    );
    expect(screen.getByTestId(childTid(TID, "title"))).toHaveTextContent("Done");
    expect(screen.getByTestId(childTid(TID, "description"))).toHaveTextContent("You finished");
    expect(screen.getByTestId(childTid(TID, "emoji"))).toHaveTextContent("🎉");
    expect(screen.getByTestId(childTid(TID, "actions", "cta"))).toBeInTheDocument();
  });

  it("omits optional emoji / description / actions blocks when not supplied", () => {
    render(<CenteredPanel data-testid={TID} title="Loading" />);
    expect(screen.getByTestId(childTid(TID, "title"))).toHaveTextContent("Loading");
    expect(screen.queryByTestId(childTid(TID, "emoji"))).toBeNull();
    expect(screen.queryByTestId(childTid(TID, "description"))).toBeNull();
    expect(screen.queryByTestId(childTid(TID, "actions"))).toBeNull();
  });
});
