import type { Exercise } from "@/lib/types";

export type ChoiceOption = { key: string; label: string; value: string };

function toShapeLabel(option: string): string {
  if (option === "circle") return "עִיגּוּל";
  if (option === "square") return "רִיבּוּעַ";
  if (option === "triangle") return "מְשֻׁלָּשׁ";
  if (option === "rectangle") return "מַלְבֵּן";
  return option;
}

export function getChoiceOptionsForExercise(exercise: Exercise): ChoiceOption[] {
  if (exercise.kind === "multiple_choice") {
    return exercise.options.map((option) => ({ key: option, label: option, value: option }));
  }
  if (exercise.kind === "shape_choice") {
    return exercise.options.map((option) => ({ key: option, label: toShapeLabel(option), value: option }));
  }
  if (exercise.kind === "true_false") {
    return [
      { key: "true", label: "נָכוֹן", value: "true" },
      { key: "false", label: "לֹא נָכוֹן", value: "false" },
    ];
  }
  return [];
}

export function shuffleChoiceOptions(options: ChoiceOption[], random: () => number = Math.random): ChoiceOption[] {
  const next = [...options];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
