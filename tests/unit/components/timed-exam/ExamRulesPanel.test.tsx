import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExamRulesPanel } from "@/components/timed-exam/ExamRulesPanel";
import { childTid } from "@/lib/testIds";

const ROOT = "km.test.rules";

function renderPanel(onContinue = vi.fn()) {
  render(
    <ExamRulesPanel rootTestId={ROOT} title="כללי המבחן" backHref="/grade/a" backTestId="km.test.back" onContinue={onContinue} />,
  );
  return onContinue;
}

describe("ExamRulesPanel", () => {
  it("renders the title, a non-empty rule list and a back link", () => {
    renderPanel();
    expect(screen.getByTestId(childTid(ROOT, "title"))).toHaveTextContent("כללי המבחן");
    expect(screen.getByTestId(childTid(ROOT, "rule", 0))).toBeInTheDocument();
    expect(screen.getByTestId("km.test.back")).toHaveAttribute("href", "/grade/a");
  });

  it("continues on the CTA", async () => {
    const onContinue = renderPanel();
    await userEvent.click(screen.getByTestId(childTid(ROOT, "cta", "continue")));
    expect(onContinue).toHaveBeenCalledOnce();
  });
});
