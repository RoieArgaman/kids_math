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

const PRE_LOGIN_SNAPSHOT_KEY = "kids_math.auth.preLoginSnapshot";

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

export function snapshotLocalStorage(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const snapshot: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith("kids_math.")) {
      snapshot[key] = window.localStorage.getItem(key) ?? "";
    }
  }
  return snapshot;
}

export function saveSnapshotToSession(snapshot: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PRE_LOGIN_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage quota — ignore
  }
}

export function restoreSnapshotFromSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(PRE_LOGIN_SNAPSHOT_KEY);
    if (!raw) return false;
    const snapshot = JSON.parse(raw) as Record<string, string>;

    // Remove all current kids_math.* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("kids_math.")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    // Restore pre-login snapshot
    Object.entries(snapshot).forEach(([key, value]) => {
      window.localStorage.setItem(key, value);
    });

    window.sessionStorage.removeItem(PRE_LOGIN_SNAPSHOT_KEY);
    return true;
  } catch {
    return false;
  }
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
