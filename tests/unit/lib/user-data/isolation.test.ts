import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearLocalOwner,
  clearLocalProgress,
  fetchUserProgressResult,
  getLocalOwner,
  replaceLocalStorageFromBundle,
  setLocalOwner,
} from "@/lib/user-data/api";
import type { UserProgressBundle } from "@/lib/user-data/types";

const OWNER_KEY = "kids_math.auth.owner.v1";

// A representative spread of PROGRESS keys (incl. legacy + level-keyed variants
// that loaders re-migrate) and PREFERENCE keys that must survive a clear.
const PROGRESS_KEYS = [
  "kids_math.streak.v1",
  "kids_math.workbook_progress.v2.grade.a",
  "kids_math.workbook_progress.v2.grade.b",
  "kids_math.workbook_progress.v1", // legacy — re-migrated to v2 if left behind
  "kids_math.workbook_progress.v1.grade.a",
  "kids_math.workbook_progress.v1.grade.b",
  "kids_math.badges.v1.grade.a",
  "kids_math.final_exam.v1.grade.a",
  "kids_math.gmat_challenge.v1.grade.a",
  "kids_math.review.v1.grade.a",
  "kids_math.english.workbook_progress.v1",
  "kids_math.english.final_exam.v1.level.a",
  "kids_math.english.final_exam.v1", // legacy english pre-level base
  "kids_math.english.review.v1",
  "kids_math.science.workbook_progress.v1",
  "kids_math.science.final_exam.v1.level.a",
  "kids_math.science.review.v1",
];

const PREFERENCE_KEYS = [
  "kids_math.tts_prefs.v1",
  "kids_math.cookie_consent.v1",
  "kids_math.admin.v1",
  "kids_math.admin_prefs.v1",
  "kids_math.analytics_events.v1",
];

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("clearLocalProgress", () => {
  it("removes every progress key (incl. legacy + level variants)", () => {
    for (const key of PROGRESS_KEYS) window.localStorage.setItem(key, "x");
    clearLocalProgress();
    for (const key of PROGRESS_KEYS) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
  });

  it("preserves device/preference keys and the owner marker", () => {
    for (const key of PROGRESS_KEYS) window.localStorage.setItem(key, "x");
    for (const key of PREFERENCE_KEYS) window.localStorage.setItem(key, "pref");
    setLocalOwner("u1");

    clearLocalProgress();

    for (const key of PREFERENCE_KEYS) {
      expect(window.localStorage.getItem(key)).toBe("pref");
    }
    expect(window.localStorage.getItem(OWNER_KEY)).toBe("u1");
  });

  it("dispatches a storage event for cleared keys so mirrored screens refresh", () => {
    window.localStorage.setItem("kids_math.badges.v1.grade.a", "x");
    const seen = new Set<string>();
    const handler = (e: StorageEvent) => {
      if (e.key) seen.add(e.key);
    };
    window.addEventListener("storage", handler);
    clearLocalProgress();
    window.removeEventListener("storage", handler);
    // Includes non-workbook domains that hydrate alone would not dispatch.
    expect(seen.has("kids_math.badges.v1.grade.a")).toBe(true);
    expect(seen.has("kids_math.streak.v1")).toBe(true);
  });
});

describe("local owner marker", () => {
  it("round-trips set → get → clear", () => {
    expect(getLocalOwner()).toBeNull();
    setLocalOwner("student-42");
    expect(getLocalOwner()).toBe("student-42");
    clearLocalOwner();
    expect(getLocalOwner()).toBeNull();
  });

  it("is not removed by clearLocalProgress", () => {
    setLocalOwner("student-42");
    clearLocalProgress();
    expect(getLocalOwner()).toBe("student-42");
  });
});

describe("replaceLocalStorageFromBundle", () => {
  it("clears prior progress, then writes the incoming bundle (server is truth)", () => {
    // Prior student's data on this device.
    window.localStorage.setItem("kids_math.workbook_progress.v2.grade.a", JSON.stringify({ prior: true }));
    window.localStorage.setItem("kids_math.badges.v1.grade.a", "stale");

    const bundle: UserProgressBundle = {
      bundleVersion: 4,
      updatedAt: new Date().toISOString(),
      streak: null,
      grades: {
        a: {
          workbook: { version: 1, days: {}, updatedAt: new Date().toISOString() },
          badges: null,
          finalExam: null,
          gmat: null,
          review: null,
        },
        b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
      },
    };

    replaceLocalStorageFromBundle(bundle);

    // Prior badges (absent on the incoming bundle) are gone — not merged.
    expect(window.localStorage.getItem("kids_math.badges.v1.grade.a")).toBeNull();
    // Incoming workbook landed.
    const raw = window.localStorage.getItem("kids_math.workbook_progress.v2.grade.a");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toMatchObject({ version: 1, days: {} });
  });
});

describe("fetchUserProgressResult", () => {
  function mockFetch(impl: () => Promise<Response>) {
    vi.stubGlobal("fetch", vi.fn(impl));
  }

  it("maps a stored bundle to { status: 'ok' }", async () => {
    const bundle = { bundleVersion: 4 };
    mockFetch(async () => new Response(JSON.stringify(bundle), { status: 200 }));
    const res = await fetchUserProgressResult();
    expect(res).toEqual({ status: "ok", bundle });
  });

  it("maps a 200 + null body to { status: 'empty' }", async () => {
    mockFetch(async () => new Response("null", { status: 200 }));
    expect(await fetchUserProgressResult()).toEqual({ status: "empty" });
  });

  it("maps a non-ok response to { status: 'error' } (NOT empty)", async () => {
    mockFetch(async () => new Response("{}", { status: 500 }));
    expect(await fetchUserProgressResult()).toEqual({ status: "error" });
  });

  it("maps a thrown fetch to { status: 'error' }", async () => {
    mockFetch(async () => {
      throw new Error("offline");
    });
    expect(await fetchUserProgressResult()).toEqual({ status: "error" });
  });
});
