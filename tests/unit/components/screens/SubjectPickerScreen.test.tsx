import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/lib/completion/reconcile", () => ({
  reconcileGradeUnlockCookies: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/completion/subjectGrade", () => ({
  isSubjectUnlockedInGrade: vi.fn(),
}));
vi.mock("@/lib/utils/preview", () => ({
  getPreviewAllFromLocation: () => false,
}));
vi.mock("@/lib/analytics/events", () => ({
  logEvent: vi.fn(),
}));
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

import SubjectPickerPage from "@/app/subjects/[grade]/page";
import { isSubjectUnlockedInGrade } from "@/lib/completion/subjectGrade";
import { logEvent } from "@/lib/analytics/events";
import type { Subject } from "@/lib/subjects";
import { testIds } from "@/lib/testIds";

afterEach(() => vi.clearAllMocks());

describe("SubjectPickerScreen (/subjects/[grade])", () => {
  it("grade A: all three subjects are links to their homes and back → grade picker", async () => {
    vi.mocked(isSubjectUnlockedInGrade).mockReturnValue(true);
    render(<SubjectPickerPage params={{ grade: "a" }} />);

    const math = await screen.findByTestId(testIds.screen.subjectPicker.mathCard());
    expect(math).toHaveAttribute("href", "/grade/a");
    expect(screen.getByTestId(testIds.screen.subjectPicker.englishCard())).toHaveAttribute("href", "/english/a");
    expect(screen.getByTestId(testIds.screen.subjectPicker.scienceCard())).toHaveAttribute("href", "/science/a");
    // All CTAs present, no locked hints.
    expect(screen.getByTestId(testIds.screen.subjectPicker.mathCardCta())).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.screen.subjectPicker.lockedHint("english"))).not.toBeInTheDocument();
    // Back link → landing grade picker.
    expect(screen.getByTestId(testIds.screen.subjectPicker.navBack())).toHaveAttribute("href", "/");
  });

  it("fires subject_selected on an unlocked card click", async () => {
    vi.mocked(isSubjectUnlockedInGrade).mockReturnValue(true);
    render(<SubjectPickerPage params={{ grade: "a" }} />);
    const math = await screen.findByTestId(testIds.screen.subjectPicker.mathCard());
    fireEvent.click(math);
    expect(logEvent).toHaveBeenCalledWith(
      "subject_selected",
      expect.objectContaining({ subject: "math", gradeId: "a" }),
    );
  });

  it("grade B partial unlock: only the done subject is a link; others are inert with a locked hint + aria-label", async () => {
    vi.mocked(isSubjectUnlockedInGrade).mockImplementation((subject: Subject) => subject === "math");
    render(<SubjectPickerPage params={{ grade: "b" }} />);

    // Math open (I2).
    const math = await screen.findByTestId(testIds.screen.subjectPicker.mathCard());
    expect(math).toHaveAttribute("href", "/grade/b");
    expect(screen.getByTestId(testIds.screen.subjectPicker.mathCardCta())).toBeInTheDocument();

    // English + Science inert (non-link div), locked hint present, aria-label conveys locked.
    const english = screen.getByTestId(testIds.screen.subjectPicker.englishCard());
    expect(english).not.toHaveAttribute("href");
    expect(english.tagName).toBe("DIV");
    expect(english).toHaveAttribute("aria-label", expect.stringContaining("נעולה"));
    expect(screen.getByTestId(testIds.screen.subjectPicker.lockedHint("english"))).toBeInTheDocument();
    expect(screen.getByTestId(testIds.screen.subjectPicker.lockedHint("science"))).toBeInTheDocument();
    // No CTA on the locked cards.
    expect(screen.queryByTestId(testIds.screen.subjectPicker.englishCardCta())).not.toBeInTheDocument();
  });

  it("invalid grade → notFound()", () => {
    expect(() => render(<SubjectPickerPage params={{ grade: "zzz" }} />)).toThrow();
    expect(notFound).toHaveBeenCalled();
  });
});
