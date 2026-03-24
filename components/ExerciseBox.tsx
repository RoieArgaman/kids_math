"use client";

import { NumberLine } from "@/components/NumberLine";
import { VerbalQuestion } from "@/components/VerbalQuestion";
import type {
  Exercise,
  MultipleChoiceExercise,
  NumberInputExercise,
  NumberLineJumpExercise,
  ShapeChoiceExercise,
  VerbalInputExercise,
} from "@/lib/types";

interface ExerciseBoxProps {
  exercise: Exercise;
  value: string;
  retryMessage?: string;
  isCorrect?: boolean;
  wasChecked?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNextInput: () => void;
  onRetry: () => void;
}

function splitMathExpression(prompt: string): { text: string; math?: string } {
  const match = prompt.match(/(\d[\d\s+\-*=?.]+)/);
  if (!match) {
    return { text: prompt };
  }

  const math = match[1].trim();
  const text = prompt.replace(match[1], "").replace(/\s{2,}/g, " ").trim();
  if (!/[+\-=]/.test(math)) {
    return { text: prompt };
  }

  return { text, math };
}

function isPositiveFeedback(message: string): boolean {
  return message.includes("מְעוּלֶּה") || message.includes("יָפֶה מְאֹד") || message.includes("נְכוֹנָה");
}

function toShapeLabel(option: string): string {
  if (option === "circle") return "עִיגּוּל";
  if (option === "square") return "רִיבּוּעַ";
  if (option === "triangle") return "מְשֻׁלָּשׁ";
  if (option === "rectangle") return "מַלְבֵּן";
  return option;
}

function ChoiceButtons({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`touch-button min-h-14 rounded-2xl transition-transform hover:scale-105 ${
            selected === option
              ? "btn-accent"
              : "border-2 border-slate-200 bg-white"
          }`}
          onClick={() => onSelect(option)}
        >
          {selected === option && <span className="me-1" aria-hidden="true">✓</span>}
          {toShapeLabel(option)}
        </button>
      ))}
    </div>
  );
}

export function ExerciseBox({
  exercise,
  value,
  retryMessage,
  isCorrect,
  wasChecked,
  onChange,
  onSubmit,
  onNextInput,
  onRetry,
}: ExerciseBoxProps) {
  const onEnter = () => {
    onSubmit();
    onNextInput();
  };
  const promptParts = splitMathExpression(exercise.prompt);

  const renderByKind = () => {
    if (exercise.kind === "number_input") {
      const typedExercise = exercise as NumberInputExercise;
      return (
        <input
          className="underline-input"
          dir="ltr"
          inputMode="numeric"
          max={typedExercise.max}
          min={typedExercise.min}
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

    if (exercise.kind === "verbal_input") {
      const typedExercise = exercise as VerbalInputExercise;
      return (
        <VerbalQuestion
          value={value}
          onChange={onChange}
          onEnter={onEnter}
          placeholder={typedExercise.hint}
        />
      );
    }

    if (exercise.kind === "multiple_choice") {
      const typedExercise = exercise as MultipleChoiceExercise;
      return (
        <ChoiceButtons options={typedExercise.options} selected={value} onSelect={onChange} />
      );
    }

    if (exercise.kind === "shape_choice") {
      const typedExercise = exercise as ShapeChoiceExercise;
      return (
        <ChoiceButtons options={typedExercise.options} selected={value} onSelect={onChange} />
      );
    }

    if (exercise.kind === "true_false") {
      return (
        <ChoiceButtons
          options={["נָכוֹן", "לֹא נָכוֹן"]}
          selected={value === "true" ? "נָכוֹן" : value === "false" ? "לֹא נָכוֹן" : value}
          onSelect={(selection) => {
            const mapped = selection === "נָכוֹן" ? "true" : "false";
            onChange(mapped);
          }}
        />
      );
    }

    if (exercise.kind === "number_line_jump") {
      const typedExercise = exercise as NumberLineJumpExercise;
      return (
        <div>
          <NumberLine start={typedExercise.start} end={typedExercise.end} />
          <input
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
  };

  const surfaceStateClass = wasChecked
    ? isCorrect
      ? "surface-success"
      : "surface-error"
    : "";

  const correctRingClass = wasChecked && isCorrect
    ? "ring-2 ring-green-400 ring-offset-2"
    : "";

  return (
    <article className={`surface mb-3 p-4 ${surfaceStateClass} ${correctRingClass}`}>
      <p className="mb-1 text-lg font-semibold">{promptParts.text}</p>
      {promptParts.math ? (
        <div className="math-line mb-2 text-lg font-bold" dir="ltr">
          {promptParts.math}
        </div>
      ) : null}
      {renderByKind()}
      {retryMessage ? (
        <div className={`mt-2 text-sm ${isPositiveFeedback(retryMessage) ? "feedback-success" : "feedback-error"}`}>
          <span aria-hidden="true">{isPositiveFeedback(retryMessage) ? "✅ " : "❌ "}</span>
          {retryMessage}
          <button type="button" className="me-2 touch-button rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100" onClick={onRetry}>
            נַסּוּ שׁוּב
          </button>
        </div>
      ) : null}
      <button type="button" className="touch-button btn-accent mt-3 w-full" onClick={onSubmit}>
        בְּדִיקָה
      </button>
    </article>
  );
}
