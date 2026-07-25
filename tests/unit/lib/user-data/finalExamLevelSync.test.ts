import { afterEach, describe, expect, it } from "vitest";
import {
  buildBundleFromLocalStorage,
  hydrateLocalStorageFromBundle,
} from "@/lib/user-data/api";
import { mergeBundles } from "@/lib/user-data/merge";
import { englishFinalExamStorageKey } from "@/lib/english/final-exam/storage";
import { scienceFinalExamStorageKey } from "@/lib/science/final-exam/storage";
import type { UserProgressBundle } from "@/lib/user-data/types";

/**
 * Regression guard for findings F1: English & Science final exams are keyed per
 * LEVEL in localStorage, but the sync bundle historically carried only Level א׳ —
 * so a passed Level ב׳ exam was dropped from sync and wiped by the login
 * clear/hydrate cycle. These tests assert every level round-trips through
 * build → merge → hydrate, in both the new (per-level map) and legacy shapes.
 */

function exam(level: "a" | "b", submittedAt: string) {
  return {
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    pickerVersion: 1,
    selectedExerciseIds: [`${level}-day-1-section-1-exercise-1`],
    answers: {},
    correctMap: {},
    submittedAt,
    scorePercent: level === "a" ? 90 : 80,
    passed: true,
    updatedAt: submittedAt,
  };
}

const EN_A = englishFinalExamStorageKey("a");
const EN_B = englishFinalExamStorageKey("b");
const SCI_A = scienceFinalExamStorageKey("a");
const SCI_B = scienceFinalExamStorageKey("b");

afterEach(() => {
  window.localStorage.clear();
});

describe("F1 — per-level final-exam cross-device sync", () => {
  it("build: includes BOTH levels' english + science exams in finalExamByLevel", () => {
    window.localStorage.setItem(EN_A, JSON.stringify(exam("a", "2026-02-01T00:00:00.000Z")));
    window.localStorage.setItem(EN_B, JSON.stringify(exam("b", "2026-02-02T00:00:00.000Z")));
    window.localStorage.setItem(SCI_A, JSON.stringify(exam("a", "2026-02-03T00:00:00.000Z")));
    window.localStorage.setItem(SCI_B, JSON.stringify(exam("b", "2026-02-04T00:00:00.000Z")));

    const bundle = buildBundleFromLocalStorage();

    expect(bundle.english?.finalExamByLevel?.a?.scorePercent).toBe(90);
    expect(bundle.english?.finalExamByLevel?.b?.scorePercent).toBe(80);
    expect(bundle.science?.finalExamByLevel?.a?.scorePercent).toBe(90);
    expect(bundle.science?.finalExamByLevel?.b?.scorePercent).toBe(80);
    // Legacy slot still carries Level א׳ for older readers.
    expect(bundle.english?.finalExam?.scorePercent).toBe(90);
  });

  it("hydrate: restores Level ב׳ from finalExamByLevel (the write side of the bug)", () => {
    const bundle = {
      bundleVersion: 4,
      updatedAt: "2026-02-02T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
      },
      english: {
        workbook: null,
        finalExam: exam("a", "2026-02-01T00:00:00.000Z"),
        finalExamByLevel: { a: exam("a", "2026-02-01T00:00:00.000Z"), b: exam("b", "2026-02-02T00:00:00.000Z") },
        review: null,
      },
      science: {
        workbook: null,
        finalExam: null,
        finalExamByLevel: { b: exam("b", "2026-02-04T00:00:00.000Z") },
        review: null,
      },
    } as unknown as UserProgressBundle;

    hydrateLocalStorageFromBundle(bundle);

    expect(JSON.parse(window.localStorage.getItem(EN_B)!).scorePercent).toBe(80);
    expect(JSON.parse(window.localStorage.getItem(SCI_B)!).scorePercent).toBe(80);
    expect(JSON.parse(window.localStorage.getItem(EN_A)!).scorePercent).toBe(90);
  });

  it("full round-trip: build → hydrate preserves Level ב׳ (survives the clear/hydrate cycle)", () => {
    window.localStorage.setItem(EN_B, JSON.stringify(exam("b", "2026-02-02T00:00:00.000Z")));
    window.localStorage.setItem(SCI_B, JSON.stringify(exam("b", "2026-02-04T00:00:00.000Z")));

    const bundle = buildBundleFromLocalStorage();
    window.localStorage.clear(); // simulate replaceLocalStorageFromBundle's clear step
    hydrateLocalStorageFromBundle(bundle);

    expect(window.localStorage.getItem(EN_B)).not.toBeNull();
    expect(window.localStorage.getItem(SCI_B)).not.toBeNull();
    expect(JSON.parse(window.localStorage.getItem(EN_B)!).passed).toBe(true);
  });

  it("merge: an old-shape push (legacy finalExam only) never drops the server's Level ב׳", () => {
    const base = {
      bundleVersion: 4,
      updatedAt: "2026-02-05T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
      },
    };
    // Server already has both levels for english.
    const existing = {
      ...base,
      english: {
        workbook: null,
        finalExam: exam("a", "2026-02-01T00:00:00.000Z"),
        finalExamByLevel: { a: exam("a", "2026-02-01T00:00:00.000Z"), b: exam("b", "2026-02-02T00:00:00.000Z") },
        review: null,
      },
    } as unknown as UserProgressBundle;
    // An older client pushes only the legacy slot (Level א׳), newer, and no map.
    const incoming = {
      ...base,
      english: {
        workbook: null,
        finalExam: exam("a", "2026-03-01T00:00:00.000Z"),
        review: null,
      },
    } as unknown as UserProgressBundle;

    const merged = mergeBundles(existing, incoming);

    // Level ב׳ from the server is preserved…
    expect(merged.english?.finalExamByLevel?.b?.scorePercent).toBe(80);
    // …and Level א׳ takes the newer incoming write.
    expect(merged.english?.finalExamByLevel?.a?.submittedAt).toBe("2026-03-01T00:00:00.000Z");
    expect(merged.english?.finalExam?.submittedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("backward-compat: a bundle with no finalExamByLevel still hydrates Level א׳ from the legacy slot", () => {
    const legacyBundle = {
      bundleVersion: 2,
      updatedAt: "2026-01-01T00:00:00.000Z",
      streak: null,
      grades: {
        a: { workbook: null, badges: null, finalExam: null, gmat: null },
        b: { workbook: null, badges: null, finalExam: null, gmat: null },
      },
      english: { workbook: null, finalExam: exam("a", "2026-01-02T00:00:00.000Z") },
    } as unknown as UserProgressBundle;

    expect(() => hydrateLocalStorageFromBundle(legacyBundle)).not.toThrow();
    expect(JSON.parse(window.localStorage.getItem(EN_A)!).scorePercent).toBe(90);
    expect(window.localStorage.getItem(EN_B)).toBeNull();
  });
});
