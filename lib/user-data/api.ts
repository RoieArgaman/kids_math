"use client";

import type {
  UserProgressBundle,
  GradeProgressData,
  EnglishProgressData,
  ScienceProgressData,
} from "./types";
import { loadProgressState } from "@/lib/progress/storage";
import { workbookProgressStorageKey } from "@/lib/progress/storage";
import { loadBadgeState } from "@/lib/badges/storage";
import { loadStreakState } from "@/lib/streak/storage";
import { loadFinalExamState } from "@/lib/final-exam/storage";
import { loadGmatChallengeState } from "@/lib/gmat-challenge/storage";
import {
  englishProgressStorageKey,
  loadEnglishProgressState,
} from "@/lib/english/storage";
import {
  englishFinalExamStorageKey,
  loadEnglishFinalExamState,
} from "@/lib/english/final-exam/storage";
import {
  scienceProgressStorageKey,
  loadScienceProgressState,
} from "@/lib/science/storage";
import {
  scienceFinalExamStorageKey,
  loadScienceFinalExamState,
} from "@/lib/science/final-exam/storage";
import {
  englishReviewStorageKey,
  scienceReviewStorageKey,
  loadReviewState,
  reviewStorageKey,
} from "@/lib/review/storage";
import type { GradeId } from "@/lib/grades";

const GRADES: GradeId[] = ["a", "b"];

/**
 * Marks which authenticated user's progress currently populates localStorage.
 * Absent means "anonymous / nobody". Read at the login/restore boundary to tell a
 * returning same-user device (safe to merge its offline work up) from a foreign or
 * anonymous device (must be cleared before hydrating the incoming user) — the core
 * of per-student isolation. Managed only by login/logout; never in the clear list.
 */
const LOCAL_OWNER_KEY = "kids_math.auth.owner.v1";

function buildGradeData(grade: GradeId): GradeProgressData {
  return {
    workbook: loadProgressState({ grade }),
    badges: loadBadgeState(grade),
    finalExam: loadFinalExamState(grade),
    gmat: loadGmatChallengeState(grade),
    review: loadReviewState({ grade }),
  };
}

function buildEnglishData(): EnglishProgressData {
  return {
    workbook: loadEnglishProgressState(),
    finalExam: loadEnglishFinalExamState(),
    review: loadReviewState({ subject: "english" }),
  };
}

function buildScienceData(): ScienceProgressData {
  return {
    workbook: loadScienceProgressState(),
    finalExam: loadScienceFinalExamState(),
    review: loadReviewState({ subject: "science" }),
  };
}

export function buildBundleFromLocalStorage(): UserProgressBundle {
  return {
    bundleVersion: 4,
    updatedAt: new Date().toISOString(),
    streak: loadStreakState(),
    grades: {
      a: buildGradeData("a"),
      b: buildGradeData("b"),
    },
    english: buildEnglishData(),
    science: buildScienceData(),
  };
}

// ---------------------------------------------------------------------------
// Local owner marker (per-student isolation)
// ---------------------------------------------------------------------------

/** The userId that currently owns local progress, or `null` for anonymous. */
export function getLocalOwner(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCAL_OWNER_KEY);
  } catch {
    return null;
  }
}

export function setLocalOwner(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_OWNER_KEY, userId);
  } catch {
    // ignore
  }
}

export function clearLocalOwner(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_OWNER_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Progress clearing (explicit allow-list — never a `kids_math.*` prefix wipe, so
// device prefs like TTS / cookie-consent / admin session always survive)
// ---------------------------------------------------------------------------

/**
 * Every localStorage key that holds learner PROGRESS. Includes legacy and
 * level-keyed variants: `loadProgressState` / `migrateLegacyExamToLevelA`
 * re-migrate legacy keys into the current key when the current one is absent, so
 * a clear that skipped them would RESURRECT the prior student's progress on the
 * next read.
 */
function progressStorageKeys(): string[] {
  const keys: string[] = ["kids_math.streak.v1"];
  for (const grade of GRADES) {
    keys.push(
      workbookProgressStorageKey(grade),
      `kids_math.badges.v1.grade.${grade}`,
      `kids_math.final_exam.v1.grade.${grade}`,
      `kids_math.gmat_challenge.v1.grade.${grade}`,
      reviewStorageKey(grade),
    );
  }
  // Legacy math workbook keys (v1) — re-migrated into v2 by loadProgressState.
  keys.push(
    "kids_math.workbook_progress.v1",
    "kids_math.workbook_progress.v1.grade.a",
    "kids_math.workbook_progress.v1.grade.b",
  );
  // English: workbook, per-level final exam + legacy pre-level base, review.
  keys.push(
    englishProgressStorageKey(),
    englishFinalExamStorageKey("a"),
    englishFinalExamStorageKey("b"),
    "kids_math.english.final_exam.v1",
    englishReviewStorageKey(),
  );
  // Science: workbook, per-level final exam, review.
  keys.push(
    scienceProgressStorageKey(),
    scienceFinalExamStorageKey("a"),
    scienceFinalExamStorageKey("b"),
    scienceReviewStorageKey(),
  );
  return keys;
}

/**
 * Remove all learner progress from localStorage and notify mirrored screens so
 * they drop to zero immediately. Preserves device/preference keys (TTS,
 * cookie-consent, admin session, analytics) and the owner marker. Used on logout
 * (wipe to zero) and before hydrating a different user's server bundle.
 */
export function clearLocalProgress(): void {
  if (typeof window === "undefined") return;
  const keys = progressStorageKeys();
  for (const key of keys) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  // Dispatch for every cleared key (superset of what hydrate dispatches — also
  // covers badges/finalExam/gmat/streak) so no mirrored screen shows stale data.
  for (const key of keys) {
    try {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: null,
          storageArea: window.localStorage,
        }),
      );
    } catch {
      // ignore
    }
  }
}

/** Clear local progress, then hydrate from the server bundle (server is truth). */
export function replaceLocalStorageFromBundle(bundle: UserProgressBundle): void {
  clearLocalProgress();
  hydrateLocalStorageFromBundle(bundle);
}

/** Writes server bundle directly to localStorage (bypasses storage module save guards). */
export function hydrateLocalStorageFromBundle(bundle: UserProgressBundle): void {
  if (typeof window === "undefined") return;

  if (bundle.streak) {
    window.localStorage.setItem("kids_math.streak.v1", JSON.stringify(bundle.streak));
  }

  for (const grade of GRADES) {
    const data = bundle.grades[grade];
    if (!data) continue;

    if (data.workbook) {
      window.localStorage.setItem(workbookProgressStorageKey(grade), JSON.stringify(data.workbook));
    }
    if (data.badges) {
      window.localStorage.setItem(`kids_math.badges.v1.grade.${grade}`, JSON.stringify(data.badges));
    }
    if (data.finalExam) {
      window.localStorage.setItem(`kids_math.final_exam.v1.grade.${grade}`, JSON.stringify(data.finalExam));
    }
    if (data.gmat) {
      window.localStorage.setItem(`kids_math.gmat_challenge.v1.grade.${grade}`, JSON.stringify(data.gmat));
    }
    // Review state (bundleVersion 3+). Absent on v1/v2 bundles — guard handles that.
    if (data.review) {
      window.localStorage.setItem(reviewStorageKey(grade), JSON.stringify(data.review));
    }
  }

  // English subject (bundleVersion 2+). Optional — v1 bundles simply skip this block.
  if (bundle.english) {
    if (bundle.english.workbook) {
      window.localStorage.setItem(englishProgressStorageKey(), JSON.stringify(bundle.english.workbook));
    }
    if (bundle.english.finalExam) {
      window.localStorage.setItem(englishFinalExamStorageKey(), JSON.stringify(bundle.english.finalExam));
    }
    // English review state (bundleVersion 3+). Absent on v1/v2 bundles — guard handles that.
    if (bundle.english.review) {
      window.localStorage.setItem(englishReviewStorageKey(), JSON.stringify(bundle.english.review));
    }
  }

  // Science subject (bundleVersion 4+). Optional — older bundles simply skip this block.
  if (bundle.science) {
    if (bundle.science.workbook) {
      window.localStorage.setItem(scienceProgressStorageKey(), JSON.stringify(bundle.science.workbook));
    }
    if (bundle.science.finalExam) {
      window.localStorage.setItem(scienceFinalExamStorageKey(), JSON.stringify(bundle.science.finalExam));
    }
    if (bundle.science.review) {
      window.localStorage.setItem(scienceReviewStorageKey(), JSON.stringify(bundle.science.review));
    }
  }

  // Dispatch storage events so useReloadOnStorageResume refreshes affected screens
  for (const grade of GRADES) {
    try {
      const key = workbookProgressStorageKey(grade);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: window.localStorage.getItem(key),
          storageArea: window.localStorage,
        }),
      );
    } catch {
      // ignore
    }
  }

  // Review keys (bundleVersion 3+) — refresh open review/warm-up screens after a pull.
  for (const grade of GRADES) {
    try {
      const key = reviewStorageKey(grade);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          newValue: window.localStorage.getItem(key),
          storageArea: window.localStorage,
        }),
      );
    } catch {
      // ignore
    }
  }

  try {
    const englishKey = englishProgressStorageKey();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: englishKey,
        newValue: window.localStorage.getItem(englishKey),
        storageArea: window.localStorage,
      }),
    );
  } catch {
    // ignore
  }

  try {
    const englishReviewKey = englishReviewStorageKey();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: englishReviewKey,
        newValue: window.localStorage.getItem(englishReviewKey),
        storageArea: window.localStorage,
      }),
    );
  } catch {
    // ignore
  }

  try {
    const scienceKey = scienceProgressStorageKey();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: scienceKey,
        newValue: window.localStorage.getItem(scienceKey),
        storageArea: window.localStorage,
      }),
    );
  } catch {
    // ignore
  }

  try {
    const scienceReviewKey = scienceReviewStorageKey();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: scienceReviewKey,
        newValue: window.localStorage.getItem(scienceReviewKey),
        storageArea: window.localStorage,
      }),
    );
  } catch {
    // ignore
  }
}

export async function fetchUserProgress(): Promise<UserProgressBundle | null> {
  try {
    const res = await fetch("/api/user/progress");
    if (!res.ok) return null;
    return (await res.json()) as UserProgressBundle;
  } catch {
    return null;
  }
}

/**
 * Result of fetching server progress, distinguishing the three cases the login
 * boundary must treat differently:
 * - `ok`    — the account has a stored bundle → replace local with it, then prime.
 * - `empty` — the server confirmed no stored doc (200 + null) → clear local, prime.
 * - `error` — network/500; we CANNOT confirm the account is empty. Clear local for
 *   confidentiality but stay UNPRIMED so no empty-now push clobbers the real
 *   server data; the next focus/nav pull-only re-heals.
 */
export type FetchProgressResult =
  | { status: "ok"; bundle: UserProgressBundle }
  | { status: "empty" }
  | { status: "error" };

export async function fetchUserProgressResult(): Promise<FetchProgressResult> {
  try {
    const res = await fetch("/api/user/progress");
    if (!res.ok) return { status: "error" };
    const data = (await res.json()) as UserProgressBundle | null;
    if (data == null) return { status: "empty" };
    return { status: "ok", bundle: data };
  } catch {
    return { status: "error" };
  }
}

export async function pushUserProgress(bundle: UserProgressBundle): Promise<boolean> {
  try {
    const res = await fetch("/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fire-and-forget push that survives page teardown (pagehide / tab close / device
 * switch). Uses `navigator.sendBeacon` when available, otherwise falls back to a
 * `keepalive` fetch. Returns whether the request was enqueued.
 */
export function beaconUserProgress(bundle: UserProgressBundle): boolean {
  if (typeof navigator === "undefined") return false;
  const url = "/api/user/progress";
  const body = JSON.stringify(bundle);

  if (typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      return navigator.sendBeacon(url, blob);
    } catch {
      // fall through to keepalive fetch
    }
  }

  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    return true;
  } catch {
    return false;
  }
}
