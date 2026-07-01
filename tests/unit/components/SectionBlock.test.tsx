import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionBlock } from "@/components/SectionBlock";
import type { WorkedExample } from "@/lib/types";
import { testIds } from "@/lib/testIds";

// The worked-example TTS button is covered separately; stub it so SectionBlock's own
// structure is what we assert here.
vi.mock("@/components/section/WorkedExampleTtsButton", () => ({
  WorkedExampleTtsButton: () => null,
}));

const SID = "day-1-section-1";

describe("SectionBlock", () => {
  it("renders the title, type emoji, learning goal and body children", () => {
    render(
      <SectionBlock sectionId={SID} title="חימום" learningGoal="נתחמם" type="warmup">
        <div data-testid="km.test.body-child">child</div>
      </SectionBlock>,
    );
    expect(screen.getByTestId(testIds.component.sectionBlock.title(SID))).toHaveTextContent("חימום");
    expect(screen.getByTestId(testIds.component.sectionBlock.emoji(SID))).toHaveTextContent("🔥");
    expect(screen.getByTestId(testIds.component.sectionBlock.learningGoal(SID))).toHaveTextContent("נתחמם");
    expect(screen.getByTestId("km.test.body-child")).toBeInTheDocument();
  });

  it("renders a worked example with its steps and takeaway when provided", () => {
    const example = {
      title: "דוגמה",
      prompt: "כמה זה?",
      steps: ["צעד א", "צעד ב"],
      takeaway: "המסקנה",
    } as unknown as WorkedExample;
    render(
      <SectionBlock sectionId={SID} title="ת" learningGoal="ל" type="arithmetic" example={example}>
        <div />
      </SectionBlock>,
    );
    expect(screen.getByTestId(testIds.component.sectionBlock.example.title(SID))).toHaveTextContent("דוגמה");
    expect(screen.getByTestId(testIds.component.sectionBlock.example.step(SID, 1))).toHaveTextContent("צעד ב");
    expect(screen.getByTestId(testIds.component.sectionBlock.example.takeaway(SID))).toHaveTextContent("המסקנה");
  });

  it("omits the worked-example article when no example is given", () => {
    render(
      <SectionBlock sectionId={SID} title="ת" learningGoal="ל" type="geometry">
        <div />
      </SectionBlock>,
    );
    expect(screen.queryByTestId(testIds.component.sectionBlock.example.root(SID))).toBeNull();
  });
});
