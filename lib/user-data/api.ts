"use client";

import type { UserProgressBundle, GradeProgressData, EnglishProgressData } from "./types";
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
import type { GradeId } from "@/lib/grades";

const GRADES: GradeId[] = ["a", "b"];

const PRE_LOGIN_SNAPSHOT_KEY = "kids_math.auth.preLoginSnapshot";

function buildGradeData(grade: GradeId): GradeProgressData {
  return {
    workbook: loadProgressState({ grade }),
    badges: loadBadgeState(grade),
    finalExam: loadFinalExamState(grade),
    gmat: loadGmatChallengeState(grade),
  };
}

function buildEnglishData(): EnglishProgressData {
  return {
    workbook: loadEnglishProgressState(),
    finalExam: loadEnglishFinalExamState(),
  };
}

export function buildBundleFromLocalStorage(): UserProgressBundle {
  return {
    bundleVersion: 2,
    updatedAt: new Date().toISOString(),
    streak: loadStreakState(),
    grades: {
      a: buildGradeData("a"),
      b: buildGradeData("b"),
    },
    english: buildEnglishData(),
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
  }

  // English subject (bundleVersion 2+). Optional — v1 bundles simply skip this block.
  if (bundle.english) {
    if (bundle.english.workbook) {
      window.localStorage.setItem(englishProgressStorageKey(), JSON.stringify(bundle.english.workbook));
    }
    if (bundle.english.finalExam) {
      window.localStorage.setItem(englishFinalExamStorageKey(), JSON.stringify(bundle.english.finalExam));
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
