"use client";

import { ExerciseRenderer } from "@/components/exercises/ExerciseRenderer";
import { MathExpressionTokens } from "@/components/ui/MathExpressionTokens";
import { childTid, testIds } from "@/lib/testIds";
import { getRenderableMathTokens } from "@/lib/utils/exerciseMathPolicy";
import { splitMathExpression, tokenizeMathExpression } from "@/lib/utils/mathText";
import { defaultHint } from "@/lib/utils/exercise";
import type { Exercise } from "@/lib/types";

interface ExerciseBoxProps {
  exercise: Exercise;
  value: string;
  retryMessage?: string;
  isCorrect?: boolean;
  wasChecked?: boolean;
  /** When false, hides the per-question check button (e.g. final exam until bulk grade). */
  showCheckButton?: boolean;
  disableRetry?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNextInput: () => void;
  onRetry: () => void;
  wrongAttempts?: number;
  hintUsed?: boolean;
  onRevealHint: () => void;
}

function isPositiveFeedback(message: string): boolean {
  return message.includes("מְעוּלֶּה") || message.includes("יָפֶה מְאֹד") || message.includes("נְכוֹנָה");
}

export function ExerciseBox({
  exercise,
  value,
  retryMessage,
  isCorrect,
  wasChecked,
  showCheckButton = true,
  onChange,
  onSubmit,
  onNextInput,
  onRetry,
  wrongAttempts,
  hintUsed,
  disableRetry,
  onRevealHint,
}: ExerciseBoxProps) {
  const promptLabel = exercise.prompt.replace(/\s+/g, " ").trim();
  const checkButtonLabel = `בְּדִיקָה: ${promptLabel}`;
  const inputLabel = `תְּשׁוּבָה לַשְּׁאֵלָה: ${promptLabel}`;
  const baseTestId = testIds.component.exerciseBox.root(exercise.id);

  const onEnter = () => {
    if (showCheckButton) {
      onSubmit();
    }
    onNextInput();
  };
  const promptParts = splitMathExpression(exercise.prompt);
  const mathTokens = promptParts.math ? tokenizeMathExpression(promptParts.math) : null;
  const renderableMathTokens = getRenderableMathTokens(exercise, mathTokens);
  const showRetryAction = Boolean(retryMessage) && isCorrect !== true && !disableRetry;
  const showHintButton = (wrongAttempts ?? 0) >= 2 && isCorrect !== true && !hintUsed;
  const showHintText = hintUsed && isCorrect !== true;
  const hintText = (showHintButton || showHintText) ? defaultHint(exercise) : null;

  const surfaceStateClass = wasChecked
    ? isCorrect
      ? hintUsed ? "surface-hint" : "surface-success"
      : "surface-error"
    : "";

  const correctRingClass = wasChecked && isCorrect
    ? hintUsed
      ? "ring-2 ring-amber-400 ring-offset-2"
      : "ring-2 ring-green-400 ring-offset-2"
    : "";

  return (
    <article
      data-testid={baseTestId}
      className={`surface mb-3 p-4 ${surfaceStateClass} ${correctRingClass}`}
    >
      <p
        data-testid={childTid(baseTestId, "prompt")}
        className="mb-2 text-lg font-semibold"
        dir="rtl"
        style={{ unicodeBidi: "plaintext" }}
      >
        {promptParts.text}
      </p>
      {renderableMathTokens ? (
        <MathExpressionTokens tokens={renderableMathTokens} baseTestId={baseTestId} />
      ) : promptParts.math ? (
        <div
          data-testid={childTid(baseTestId, "math")}
          className="math-line mb-2 text-lg font-bold"
          dir="ltr"
          style={{ unicodeBidi: "isolate" }}
        >
          {promptParts.math}
        </div>
      ) : null}
      <ExerciseRenderer
        exercise={exercise}
        value={value}
        inputLabel={inputLabel}
        baseTestId={baseTestId}
        onChange={onChange}
        onEnter={onEnter}
      />
      {retryMessage ? (
        <div
          data-testid={childTid(baseTestId, "feedback")}
          className={`mt-2 text-sm ${isPositiveFeedback(retryMessage) ? "feedback-success" : "feedback-error"}`}
        >
          <span data-testid={childTid(baseTestId, "feedback", "icon")} aria-hidden="true">
            {isPositiveFeedback(retryMessage) ? "✅ " : "❌ "}
          </span>
          {retryMessage}
          {showRetryAction ? (
            <button
              data-testid={testIds.component.exerciseBox.retry(exercise.id)}
              type="button"
              className="me-2 touch-button rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
              onClick={onRetry}
            >
              נַסּוּ שׁוּב
            </button>
          ) : null}
        </div>
      ) : null}
      {showHintButton ? (
        <button
          data-testid={testIds.component.exerciseBox.hint(exercise.id)}
          type="button"
          className="touch-button mt-2 w-full rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          onClick={onRevealHint}
        >
          💡 צְרִיכִים רֶמֶז?
        </button>
      ) : null}
      {showHintText && hintText ? (
        <div
          data-testid={testIds.component.exerciseBox.hintText(exercise.id)}
          className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"
          dir="rtl"
          role="status"
          aria-live="polite"
        >
          💡 {hintText}
        </div>
      ) : null}
      {showCheckButton ? (
        <button
          data-testid={testIds.component.exerciseBox.check(exercise.id)}
          type="button"
          aria-label={checkButtonLabel}
          className="touch-button btn-accent mt-3 w-full"
          onClick={onSubmit}
        >
          בְּדִיקָה
        </button>
      ) : null}
    </article>
  );
}
