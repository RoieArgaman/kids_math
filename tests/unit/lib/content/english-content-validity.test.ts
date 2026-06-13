import { describe, expect, it } from "vitest";
import { getEnglishDays } from "@/lib/content/english-workbook";
import { isAnswerCorrect } from "@/lib/utils/exercise";
import type { Exercise } from "@/lib/types";

const days = getEnglishDays();

function canonicalAnswer(ex: Exercise): string {
  switch (ex.kind) {
    case "multiple_choice":
    case "listen_choose":
      return ex.answer;
    case "true_false":
      return ex.answer ? "true" : "false";
    case "letter_tiles":
      return ex.word;
    case "match_pairs":
      return JSON.stringify(Object.fromEntries(ex.pairs.map((p) => [p.left, p.right])));
    default:
      return String((ex as { answer?: unknown }).answer ?? "");
  }
}

describe("english curriculum validity", () => {
  it("has at least one day", () => {
    expect(days.length).toBeGreaterThan(0);
  });

  for (const day of days) {
    describe(`${day.id} — ${day.title}`, () => {
      it("has sequential, well-formed ids", () => {
        expect(day.id).toMatch(/^day-\d+$/);
        day.sections.forEach((section, sIdx) => {
          expect(section.id).toBe(`${day.id}-section-${sIdx}`);
          section.exercises.forEach((ex, eIdx) => {
            expect(ex.id).toBe(`${section.id}-exercise-${eIdx + 1}`);
          });
        });
      });

      it("respects exercise-count contracts (non-last 4–8, last 6–10)", () => {
        day.sections.forEach((section, idx) => {
          const isLast = idx === day.sections.length - 1;
          const n = section.exercises.length;
          if (isLast) {
            expect(n, `${section.id} last`).toBeGreaterThanOrEqual(6);
            expect(n, `${section.id} last`).toBeLessThanOrEqual(10);
          } else {
            expect(n, `${section.id}`).toBeGreaterThanOrEqual(4);
            expect(n, `${section.id}`).toBeLessThanOrEqual(8);
          }
        });
      });

      it("every exercise grades its own canonical answer as correct", () => {
        for (const section of day.sections) {
          for (const ex of section.exercises) {
            expect(isAnswerCorrect(ex, canonicalAnswer(ex)), `${ex.id} (${ex.kind})`).toBe(true);
          }
        }
      });

      it("choice answers are present among the options; pairs are well-formed", () => {
        for (const section of day.sections) {
          for (const ex of section.exercises) {
            if (ex.kind === "multiple_choice" || ex.kind === "listen_choose") {
              expect(ex.options, `${ex.id} options include answer`).toContain(ex.answer);
              expect(ex.options.length).toBeGreaterThanOrEqual(2);
            }
            if (ex.kind === "letter_tiles") {
              expect(ex.word.length, `${ex.id} word`).toBeGreaterThan(0);
            }
            if (ex.kind === "match_pairs") {
              expect(ex.pairs.length, `${ex.id} pairs`).toBeGreaterThanOrEqual(2);
              for (const p of ex.pairs) {
                expect(p.left.length).toBeGreaterThan(0);
                expect(p.right.length).toBeGreaterThan(0);
              }
            }
          }
        }
      });
    });
  }
});
