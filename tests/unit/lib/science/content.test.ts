import { describe, expect, it } from "vitest";
import { getAllScienceDays, getScienceDays } from "@/lib/content/science-workbook";
import { validateExerciseArithmetic } from "@/lib/content/engine/validate";
import type { Exercise } from "@/lib/types";

const days = getAllScienceDays();
const allExercises: Exercise[] = days.flatMap((d) => d.sections.flatMap((s) => s.exercises));

/** Latin letters anywhere in spoken content would force the English TTS voice / break 100%-Hebrew. */
const LATIN_REGEX = /[A-Za-z]/;

describe("science content — structure & validity", () => {
  it("ships at least one playable day", () => {
    expect(days.length).toBeGreaterThan(0);
    expect(allExercises.length).toBeGreaterThan(0);
  });

  it("every exercise passes the deterministic arithmetic backstop", () => {
    for (const ex of allExercises) {
      expect(validateExerciseArithmetic(ex), `failed for ${ex.id}`).toBeNull();
    }
  });

  it("multiple-choice answers are present in options and options are unique", () => {
    for (const ex of allExercises) {
      if (ex.kind === "multiple_choice") {
        expect(ex.options.includes(ex.answer), `${ex.id}: answer not in options`).toBe(true);
        expect(new Set(ex.options).size, `${ex.id}: duplicate options`).toBe(ex.options.length);
      }
    }
  });

  it("exercise ids are globally unique across both levels", () => {
    const ids = allExercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Locks the per-level day sets the parent dashboard + admin progress read via
  // getScienceDays(level): completion counts/denominators scale off these arrays,
  // so a miswired index.ts (dropped/duplicated day) is caught here.
  it("ships the full curriculum: Level א׳ = 10 days (1–10), Level ב׳ = 7 days (11–17)", () => {
    const levelA = getScienceDays("a");
    const levelB = getScienceDays("b");
    expect(levelA).toHaveLength(10);
    expect(levelB).toHaveLength(7);
    expect(levelA.map((d) => d.id)).toEqual([
      "day-1",
      "day-2",
      "day-3",
      "day-4",
      "day-5",
      "day-6",
      "day-7",
      "day-8",
      "day-9",
      "day-10",
    ]);
    expect(levelB.map((d) => d.id)).toEqual([
      "day-11",
      "day-12",
      "day-13",
      "day-14",
      "day-15",
      "day-16",
      "day-17",
    ]);
  });
});

describe("science content — 100% Hebrew guarantee (regression guard)", () => {
  it("uses only tap-based, Hebrew-voiced exercise kinds (no English-audio kinds)", () => {
    for (const ex of allExercises) {
      expect(
        ["multiple_choice", "true_false", "match_pairs"].includes(ex.kind),
        `${ex.id}: disallowed kind "${ex.kind}" (listen_choose/letter_tiles route to the English voice)`,
      ).toBe(true);
    }
  });

  it("never flags options or match-pairs sides as English (would force LTR / English voice)", () => {
    for (const ex of allExercises) {
      if (ex.kind === "multiple_choice" || ex.kind === "match_pairs") {
        // listen_choose carries optionsLang; mc/match_pairs must never be "en".
        expect((ex as { optionsLang?: string }).optionsLang).not.toBe("en");
      }
      if (ex.kind === "match_pairs") {
        expect(ex.leftLang).not.toBe("en");
        expect(ex.rightLang).not.toBe("en");
      }
    }
  });

  it("contains no Latin letters in any spoken/visible string (emoji are allowed)", () => {
    for (const ex of allExercises) {
      expect(LATIN_REGEX.test(ex.prompt), `${ex.id}: Latin letters in prompt`).toBe(false);
      if (ex.kind === "multiple_choice") {
        for (const opt of ex.options) {
          expect(LATIN_REGEX.test(opt), `${ex.id}: Latin letters in option "${opt}"`).toBe(false);
        }
      }
      if (ex.kind === "match_pairs") {
        for (const pair of ex.pairs) {
          expect(LATIN_REGEX.test(pair.left) || LATIN_REGEX.test(pair.right), `${ex.id}: Latin in pair`).toBe(false);
        }
      }
    }
  });

  it("day titles, objectives and teaching text are Latin-free Hebrew", () => {
    for (const day of days) {
      expect(LATIN_REGEX.test(day.title), `${day.id}: Latin in title`).toBe(false);
      expect(LATIN_REGEX.test(day.objective), `${day.id}: Latin in objective`).toBe(false);
      if (day.teachingSummary) {
        expect(LATIN_REGEX.test(day.teachingSummary), `${day.id}: Latin in summary`).toBe(false);
      }
    }
  });
});

/**
 * Authoring-quality guards — structural defenses against "stupid answers":
 * ambiguous matches, coin-flip choice sets, and copy-paste duplicates that a
 * human audit can miss across 17 days. These don't judge facts (that's the
 * content audit) but catch mechanically-broken questions.
 */
describe("science content — authoring quality guards", () => {
  it("every day has warmup → verbal → review sections, each non-empty", () => {
    for (const day of days) {
      expect(day.sections.length, `${day.id}: expected 3 sections`).toBe(3);
      expect(day.sections.map((s) => s.type)).toEqual(["warmup", "verbal", "review"]);
      for (const section of day.sections) {
        expect(section.exercises.length, `${section.id}: too few exercises`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("multiple-choice offers a real choice (3–4 distinct options), never a coin flip", () => {
    for (const ex of allExercises) {
      if (ex.kind === "multiple_choice") {
        expect(ex.options.length, `${ex.id}: needs 3–4 options`).toBeGreaterThanOrEqual(3);
        expect(ex.options.length, `${ex.id}: too many options`).toBeLessThanOrEqual(4);
        for (const opt of ex.options) {
          expect(opt.trim().length, `${ex.id}: empty option`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("match-pairs are unambiguous: ≥2 pairs with distinct lefts AND distinct rights", () => {
    for (const ex of allExercises) {
      if (ex.kind === "match_pairs") {
        expect(ex.pairs.length, `${ex.id}: needs ≥2 pairs`).toBeGreaterThanOrEqual(2);
        const lefts = ex.pairs.map((p) => p.left);
        const rights = ex.pairs.map((p) => p.right);
        // A repeated right (or left) makes the match ambiguous — two "correct" targets.
        expect(new Set(lefts).size, `${ex.id}: duplicate left side (ambiguous)`).toBe(lefts.length);
        expect(new Set(rights).size, `${ex.id}: duplicate right side (ambiguous)`).toBe(rights.length);
      }
    }
  });

  it("no two exercises inside a section share the same prompt (copy-paste guard)", () => {
    for (const day of days) {
      for (const section of day.sections) {
        const prompts = section.exercises.map((e) => e.prompt);
        expect(new Set(prompts).size, `${section.id}: duplicate prompt`).toBe(prompts.length);
      }
    }
  });

  it("difficulty stays within the G1–G2 ladder (1–3) and representation is valid", () => {
    const reps = new Set(["concrete", "pictorial", "abstract"]);
    for (const ex of allExercises) {
      expect(ex.meta.difficulty, `${ex.id}: difficulty out of G1–G2 range`).toBeGreaterThanOrEqual(1);
      expect(ex.meta.difficulty, `${ex.id}: difficulty out of G1–G2 range`).toBeLessThanOrEqual(3);
      expect(reps.has(ex.meta.representation), `${ex.id}: bad representation`).toBe(true);
    }
  });
});
