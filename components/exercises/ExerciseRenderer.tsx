"use client";

import { NumberLine } from "@/components/NumberLine";
import { RandomizedChoiceButtons } from "@/components/exercises/RandomizedChoiceButtons";
import { childTid, testIds } from "@/lib/testIds";
import type { Exercise } from "@/lib/types";
import { getChoiceOptionsForExercise } from "@/lib/utils/choiceOptions";

const SHAPE_NAMES = new Set(["circle", "square", "triangle", "rectangle"]);

function hasAllShapeOptions(options: string[]): boolean {
  return options.length > 0 && options.every((o) => SHAPE_NAMES.has(o));
}

interface ExerciseRendererProps {
  exercise: Exercise;
  value: string;
  inputLabel: string;
  baseTestId: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}

export function ExerciseRenderer({
  exercise,
  value,
  inputLabel,
  baseTestId,
  onChange,
  onEnter,
}: ExerciseRendererProps) {
  if (exercise.kind === "number_input") {
    return (
      <input
        data-testid={testIds.component.exerciseBox.input(exercise.id)}
        data-exercise-focus="true"
        aria-label={inputLabel}
        className="underline-input"
        dir="ltr"
        inputMode="numeric"
        max={exercise.max}
        min={exercise.min}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          }
        }}
        type="number"
        value={value}
      />
    );
  }

  if (exercise.kind === "multiple_choice") {
    const isShapeQuestion = hasAllShapeOptions(exercise.options);
    return (
      <RandomizedChoiceButtons
        exerciseId={exercise.id}
        options={getChoiceOptionsForExercise(exercise)}
        selected={value}
        onSelect={onChange}
        renderAsShapes={isShapeQuestion}
      />
    );
  }

  if (exercise.kind === "shape_choice") {
    return (
      <RandomizedChoiceButtons
        exerciseId={exercise.id}
        options={getChoiceOptionsForExercise(exercise)}
        selected={value}
        onSelect={onChange}
        renderAsShapes
      />
    );
  }

  if (exercise.kind === "true_false") {
    return (
      <RandomizedChoiceButtons
        exerciseId={exercise.id}
        options={getChoiceOptionsForExercise(exercise)}
        selected={value}
        onSelect={onChange}
      />
    );
  }

  return (
    <div data-testid={childTid(baseTestId, "number-line-jump")}>
      <NumberLine start={exercise.start} end={exercise.end} />
      <input
        data-testid={testIds.component.exerciseBox.input(exercise.id)}
        data-exercise-focus="true"
        aria-label={inputLabel}
        className="underline-input mt-2"
        dir="ltr"
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEnter();
          }
        }}
        placeholder="כִּתְבוּ מִסְפָּר"
        type="number"
        value={value}
      />
    </div>
  );
}
