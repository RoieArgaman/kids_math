import { describe, expect, it } from "vitest";
import { getAllScienceDays } from "@/lib/content/science-workbook";
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
