"use client";

import { useState } from "react";
import { childTid, testIds } from "@/lib/testIds";
import type { ChoiceOption } from "@/lib/utils/choiceOptions";
import { shuffleChoiceOptions } from "@/lib/utils/choiceOptions";
import { ShapeIcon } from "@/components/exercises/ShapeIcon";

const MATH_EXPR_RE = /\d\s*[+\-×÷*/=<>]\s*\d/;
function isMathLabel(label: string): boolean {
  return MATH_EXPR_RE.test(label);
}

interface RandomizedChoiceButtonsProps {
  exerciseId: string;
  options: ChoiceOption[];
  selected: string;
  onSelect: (value: string) => void;
  renderAsShapes?: boolean;
}

export function RandomizedChoiceButtons({
  exerciseId,
  options,
  selected,
  onSelect,
  renderAsShapes = false,
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
          className={`touch-button rounded-2xl transition-transform hover:scale-105 ${renderAsShapes ? "relative min-h-24 py-3" : "min-h-14"} ${selected === option.value ? "btn-accent" : "border-2 border-slate-200 bg-white"}`}
          onClick={() => onSelect(option.value)}
        >
          {selected === option.value ? (
            <span
              data-testid={childTid(testIds.component.exerciseBox.root(exerciseId), "choice", option.key, "selected")}
              className={renderAsShapes ? "absolute top-1 end-2" : "me-1"}
              aria-hidden="true"
            >
              ✓
            </span>
          ) : null}
          {renderAsShapes ? (
            <ShapeIcon shape={option.value} />
          ) : isMathLabel(option.label) ? (
            <span data-testid={testIds.component.mathLabel(exerciseId, option.key)} dir="ltr" style={{ unicodeBidi: "isolate" }}>{option.label}</span>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
