import { describe, expect, it } from "vitest";
import { englishLevelADays } from "@/lib/content/english";
import type { Exercise, WorkbookDay } from "@/lib/types";

/**
 * Reading-readiness guard (the "align reading demand to reading instruction" rule).
 *
 * A true beginner in Level A knows only Hebrew and cannot read English yet. The
 * alphabet is taught on Days 8–11 and CVC decoding on Days 12–14, so the learner
 * must never be required to *read* English to answer before that point.
 *
 * Phases:
 *  - Days 1–7  (pre-letter): no reading/encoding of English at all. The only
 *    English allowed is *audio* (listen_choose.audioText) or *tap-to-hear* tiles
 *    (match_pairs.audioByLeft). No multiple_choice / true_false / letter_tiles;
 *    listen_choose options must be Hebrew/digits (optionsLang !== "en").
 *  - Days 8–14 (alphabet → decoding): single-letter reading is fair; any
 *    match_pairs that shows English *words* (left length ≥ 2) must back every
 *    such tile with audio so a learner can hear, not only read, it.
 */

const PRE_LETTER_MAX_DAY = 7;
const FORBIDDEN_PRE_LETTER_KINDS: ReadonlySet<Exercise["kind"]> = new Set([
  "multiple_choice",
  "true_false",
  "letter_tiles",
]);

function forEachExercise(
  days: WorkbookDay[],
  visit: (ex: Exercise, ctx: { day: WorkbookDay; sectionId: string }) => void,
): void {
  for (const day of days) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        visit(ex, { day, sectionId: section.id });
      }
    }
  }
}

describe("English Level A — reading-readiness", () => {
  it("Days 1–7 require zero English reading or encoding", () => {
    const violations: string[] = [];
    forEachExercise(englishLevelADays, (ex, { day }) => {
      if (day.dayNumber > PRE_LETTER_MAX_DAY) return;

      if (FORBIDDEN_PRE_LETTER_KINDS.has(ex.kind)) {
        violations.push(`${ex.id}: kind "${ex.kind}" requires reading/encoding English`);
      }
      if (ex.kind === "listen_choose" && ex.optionsLang === "en") {
        violations.push(`${ex.id}: listen_choose options are English text (optionsLang="en")`);
      }
    });
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("every English-word match tile is audio-backed (all Level A days)", () => {
    const violations: string[] = [];
    forEachExercise(englishLevelADays, (ex) => {
      if (ex.kind !== "match_pairs" || ex.leftLang !== "en") return;
      // Single letters (e.g. "A") are readable once the alphabet is taught; only
      // multi-character English words must be hearable.
      const wordLefts = ex.pairs.map((p) => p.left).filter((l) => l.trim().length >= 2);
      for (const left of wordLefts) {
        if (!ex.audioByLeft || !ex.audioByLeft[left]) {
          violations.push(`${ex.id}: English tile "${left}" has no audioByLeft entry`);
        }
      }
    });
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
