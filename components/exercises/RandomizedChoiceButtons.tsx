"use client";

import { useState } from "react";
import { childTid, testIds } from "@/lib/testIds";
import type { ChoiceOption } from "@/lib/utils/choiceOptions";
import { shuffleChoiceOptions } from "@/lib/utils/choiceOptions";

interface RandomizedChoiceButtonsProps {
  exerciseId: string;
  options: ChoiceOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function RandomizedChoiceButtons({
  exerciseId,
  options,
  selected,
  onSelect,
}: RandomizedChoiceButtonsProps) {
  const [randomizedOptions] = useState(() => shuffleChoiceOptions(options));

  return (
    <div
      data-testid={childTid(testIds.component.exerciseBox.root(exerciseId), "choices")}
      className="mt-2 grid grid-cols-2 gap-2"
    >
      {randomizedOptions.map((option, index) => (
        <button
          data-testid={testIds.component.exerciseBox.choice(exerciseId, option.key)}
          data-exercise-focus={index === 0 ? "true" : undefined}
          key={option.key}
          type="button"
          className={`touch-button min-h-14 rounded-2xl transition-transform hover:scale-105 ${selected === option.value ? "btn-accent" : "border-2 border-slate-200 bg-white"}`}
          onClick={() => onSelect(option.value)}
        >
          {selected === option.value ? (
            <span
              data-testid={childTid(testIds.component.exerciseBox.root(exerciseId), "choice", option.key, "selected")}
              className="me-1"
              aria-hidden="true"
            >
              ✓
            </span>
          ) : null}
          {option.label}
        </button>
      ))}
    </div>
  );
}
