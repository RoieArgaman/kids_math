import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/completion/reconcile", () => ({
  reconcileGradeUnlockCookies: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/completion/subjectGrade", () => ({
  isGradeUnlocked: vi.fn(),
}));
vi.mock("@/lib/utils/preview", () => ({
  getPreviewAllFromLocation: () => false,
}));
vi.mock("@/lib/analytics/events", () => ({
  logEvent: vi.fn(),
}));

import GradePickerPage from "@/app/page";
import { isGradeUnlocked } from "@/lib/completion/subjectGrade";
import { reconcileGradeUnlockCookies } from "@/lib/completion/reconcile";
import { logEvent } from "@/lib/analytics/events";
import { testIds } from "@/lib/testIds";

afterEach(() => vi.clearAllMocks());

describe("GradePickerScreen (/)", () => {
  it("Grade A is always a link to the subject picker and logs grade_selected", async () => {
    vi.mocked(isGradeUnlocked).mockReturnValue(false);
    render(<GradePickerPage />);

    const gradeA = await screen.findByTestId(testIds.screen.gradePicker.gradeCard("a"));
    expect(gradeA).toHaveAttribute("href", "/subjects/a");

    fireEvent.click(gradeA);
    expect(logEvent).toHaveBeenCalledWith(
      "grade_selected",
      expect.objectContaining({ gradeId: "a" }),
    );
  });

  it("awaits reconcile before rendering, then locks Grade B when no subject is done", async () => {
    vi.mocked(isGradeUnlocked).mockReturnValue(false);
    render(<GradePickerPage />);

    // Grade B is an inert card: no href, no CTA, and a locked hint (I3).
    const gradeB = await screen.findByTestId(testIds.screen.gradePicker.gradeCard("b"));
    expect(gradeB).not.toHaveAttribute("href");
    expect(screen.queryByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).not.toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.gradePicker.gradeLockedHint("b"))).toBeInTheDocument();

    expect(reconcileGradeUnlockCookies).toHaveBeenCalledTimes(1);
    // Unlock state read AFTER reconcile settles (await-before-CTA contract).
    expect(isGradeUnlocked).toHaveBeenCalledWith("b", { previewAll: false });
  });

  it("opens Grade B (link + CTA, no hint) when a subject is done", async () => {
    vi.mocked(isGradeUnlocked).mockReturnValue(true);
    render(<GradePickerPage />);

    const gradeB = await screen.findByTestId(testIds.screen.gradePicker.gradeCard("b"));
    expect(gradeB).toHaveAttribute("href", "/subjects/b");
    await waitFor(() =>
      expect(screen.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toBeInTheDocument(),
    );
    expect(screen.queryByTestId(testIds.screen.gradePicker.gradeLockedHint("b"))).not.toBeInTheDocument();
  });
});
