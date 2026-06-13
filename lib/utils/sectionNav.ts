import type { WorkbookDay, ExerciseId, Section } from "@/lib/types";

/**
 * Returns the next section in `day` after `currentSectionIdx` if it is unlocked,
 * or null if there is no next section or it is locked.
 *
 * Unlock rules (mirrors DayOverviewScreen.getSectionCardState):
 *  - No "next" when currentSectionIdx is the last section.
 *  - Last section unlocks only when ALL prior sections are complete.
 *  - Any other next section unlocks when warmup (index 0) is complete.
 */
export function getNextUnlockedSection(
  day: WorkbookDay,
  currentSectionIdx: number,
  correctAnswers: Record<ExerciseId, boolean>,
): Section | null {
  const nextIdx = currentSectionIdx + 1;
  if (nextIdx >= day.sections.length) return null;

  const nextSection = day.sections[nextIdx];
  const isNextLast = nextIdx === day.sections.length - 1;

  if (isNextLast) {
    const allPriorComplete = day.sections
      .slice(0, -1)
      .every((s) => s.exercises.every((ex) => correctAnswers[ex.id] === true));
    return allPriorComplete ? nextSection : null;
  }

  const warmup = day.sections[0];
  const warmupComplete =
    warmup?.exercises.every((ex) => correctAnswers[ex.id] === true) ?? false;
  return warmupComplete ? nextSection : null;
}
