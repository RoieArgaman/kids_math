import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/completion/subjectGrade", () => ({
  isSubjectGradeComplete: vi.fn(),
}));

import { isSubjectGradeComplete } from "@/lib/completion/subjectGrade";
import { clearReconcileGuards, reconcileGradeUnlockCookies } from "@/lib/completion/reconcile";

function postedSubjects(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((call) => {
    const body = JSON.parse((call[1] as RequestInit).body as string) as { subject: string };
    return body.subject;
  });
}

describe("reconcileGradeUnlockCookies (unlock-only self-heal)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("POSTs unlock only for subjects completed in grade A", async () => {
    vi.mocked(isSubjectGradeComplete).mockImplementation((subject) => subject === "english");
    await reconcileGradeUnlockCookies();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/grade-b-unlock");
    expect(postedSubjects(fetchMock)).toEqual(["english"]);
  });

  it("never POSTs for a fresh learner (nothing complete → zero requests)", async () => {
    vi.mocked(isSubjectGradeComplete).mockReturnValue(false);
    await reconcileGradeUnlockCookies();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("guards to one POST per subject per session", async () => {
    vi.mocked(isSubjectGradeComplete).mockReturnValue(true);
    await reconcileGradeUnlockCookies(); // math, english, science
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockClear();
    await reconcileGradeUnlockCookies(); // guarded → no re-POST
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("previewAll bypasses reconciliation entirely", async () => {
    vi.mocked(isSubjectGradeComplete).mockReturnValue(true);
    await reconcileGradeUnlockCookies({ previewAll: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("a FAILED unlock POST does not set the session guard (retries next mount)", async () => {
    vi.mocked(isSubjectGradeComplete).mockImplementation((s) => s === "math");
    fetchMock.mockResolvedValue({ ok: false } as Response);
    await reconcileGradeUnlockCookies();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // guard NOT set → second mount retries
    await reconcileGradeUnlockCookies();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("still POSTs when sessionStorage is unavailable (private mode)", async () => {
    vi.mocked(isSubjectGradeComplete).mockImplementation((s) => s === "science");
    const getItem = vi
      .spyOn(window.sessionStorage.__proto__, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    await reconcileGradeUnlockCookies();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    getItem.mockRestore();
  });
});

describe("clearReconcileGuards", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("removes the per-subject session guards so the next student re-evaluates unlock", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));
    vi.mocked(isSubjectGradeComplete).mockReturnValue(true);

    await reconcileGradeUnlockCookies(); // sets guards for math/english/science
    expect(window.sessionStorage.getItem("kids_math.reconciled.b.math")).toBe("1");

    clearReconcileGuards();

    expect(window.sessionStorage.getItem("kids_math.reconciled.b.math")).toBeNull();
    expect(window.sessionStorage.getItem("kids_math.reconciled.b.english")).toBeNull();
    expect(window.sessionStorage.getItem("kids_math.reconciled.b.science")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("is a safe no-op when there are no guards", () => {
    expect(() => clearReconcileGuards()).not.toThrow();
  });
});
