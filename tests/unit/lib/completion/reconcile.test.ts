import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/completion/subjectGrade", () => ({
  isSubjectGradeComplete: vi.fn(),
}));

import { isSubjectGradeComplete } from "@/lib/completion/subjectGrade";
import { reconcileGradeUnlockCookies } from "@/lib/completion/reconcile";

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
});
