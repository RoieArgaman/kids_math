import { describe, expect, it } from "vitest";
import { englishLevelADays } from "@/lib/content/english";

/**
 * Storage-safety guard. Learner progress in localStorage is keyed by day /
 * section / exercise id. The reading-readiness rework swaps exercise *kinds*
 * in place but must NOT rename or drop any id, nor change the per-section
 * exercise count — doing so would orphan completed progress.
 *
 * The snapshot below is captured from the content as it was *before* the
 * rework; it must remain identical afterwards.
 */
describe("English Level A — id stability", () => {
  it("day/section/exercise id structure is unchanged", () => {
    const structure = englishLevelADays.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      sections: day.sections.map((s) => ({
        id: s.id,
        exerciseIds: s.exercises.map((e) => e.id),
      })),
    }));
    expect(structure).toMatchSnapshot();
  });
});
