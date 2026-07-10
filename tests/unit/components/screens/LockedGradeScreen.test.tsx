import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LockedGradeScreen } from "@/components/screens/LockedGradeScreen";
import { childTid } from "@/lib/testIds";

const ROOT = "km.test.locked-root";

describe("LockedGradeScreen", () => {
  it("renders title, reason, and the primary CTA with its href", () => {
    render(
      <LockedGradeScreen
        rootTestId={ROOT}
        title="נעול"
        reason="למה נעול ואיך פותחים"
        primary={{ href: "/subjects/a", label: "חזרה", testId: "km.test.primary" }}
      />,
    );
    expect(screen.getByTestId(ROOT)).toBeInTheDocument();
    expect(screen.getByTestId(childTid(ROOT, "title"))).toHaveTextContent("נעול");
    expect(screen.getByTestId(childTid(ROOT, "reason"))).toHaveTextContent("למה נעול ואיך פותחים");
    const primary = screen.getByTestId("km.test.primary");
    expect(primary).toHaveAttribute("href", "/subjects/a");
  });

  it("omits the secondary CTA when not provided", () => {
    render(
      <LockedGradeScreen
        rootTestId={ROOT}
        title="נעול"
        reason="..."
        primary={{ href: "/", label: "a", testId: "km.test.primary" }}
      />,
    );
    expect(screen.queryByTestId("km.test.secondary")).not.toBeInTheDocument();
  });

  it("renders the secondary CTA when provided", () => {
    render(
      <LockedGradeScreen
        rootTestId={ROOT}
        reasonTestId="km.test.reason"
        title="נעול"
        reason="..."
        primary={{ href: "/", label: "a", testId: "km.test.primary" }}
        secondary={{ href: "/exam", label: "b", testId: "km.test.secondary" }}
      />,
    );
    // Custom reasonTestId is honored (used by the english/science/grade locked pages).
    expect(screen.getByTestId("km.test.reason")).toBeInTheDocument();
    expect(screen.getByTestId("km.test.secondary")).toHaveAttribute("href", "/exam");
  });
});
