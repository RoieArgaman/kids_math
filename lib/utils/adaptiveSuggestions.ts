import type { Exercise, ExerciseId, Section } from "@/lib/types";

/**
 * Returns up to `limit` exercises from `sections` that the student has not yet answered
 * correctly, ordered by: explicitly wrong (correctAnswers[id] === false) first,
 * then unanswered (correctAnswers[id] === undefined).
 *
 * Pure function — no storage reads.
 */
export function getWeakExercises(
  sections: Section[],
  correctAnswers: Record<ExerciseId, boolean>,
  limit: number,
): Exercise[] {
  const wrong: Exercise[] = [];
  const unanswered: Exercise[] = [];

  for (const section of sections) {
    for (const exercise of section.exercises) {
      const state = correctAnswers[exercise.id as ExerciseId];
      if (state === true) continue;
      if (state === false) {
        wrong.push(exercise);
      } else {
        unanswered.push(exercise);
      }
    }
  }

  return [...wrong, ...unanswered].slice(0, limit);
}

/**
 * Finds which section contains a given exercise id.
 * Returns the section or undefined if not found.
 */
export function findSectionForExercise(
  sections: Section[],
  exerciseId: ExerciseId,
): Section | undefined {
  return sections.find((s) => s.exercises.some((ex) => ex.id === exerciseId));
}
