"use client";

import { useCallback, useRef, useState } from "react";

import { ExerciseItem } from "@/components/exercises/ExerciseItem";
import type { GradeId } from "@/lib/grades";
import { useSpiralReview } from "@/lib/hooks/useSpiralReview";
import type { Subject } from "@/lib/subjects";
import { childTid, testIds } from "@/lib/testIds";
import type { DayId, Exercise, ExerciseId, SectionId } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect, normalizeAnswerValue } from "@/lib/utils/exercise";

interface SpiralReviewBlockProps {
  grade: GradeId;
  subject?: Subject;
  dayId: DayId;
  sectionId: SectionId;
}

/**
 * EPHEMERAL spiral-review practice block rendered above the warm-up section.
 * Grades entirely in LOCAL state and persists outcomes ONLY through the review SR
 * overlay (`record`) — it never touches the current day's DayProgressState. Renders
 * nothing until hydrated or when there are no due candidates, so warm-up looks normal.
 */
export function SpiralReviewBlock({ grade, subject, dayId, sectionId }: SpiralReviewBlockProps) {
  const { candidates, record, isHydrated } = useSpiralReview({ grade, subject, dayId });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [hintUsed, setHintUsed] = useState<Record<string, boolean>>({});

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;
  const wrongAttemptsRef = useRef(wrongAttempts);
  wrongAttemptsRef.current = wrongAttempts;

  const onChangeValue = useCallback((exerciseId: ExerciseId, value: string) => {
    setAnswers((prev) => ({ ...prev, [exerciseId]: value }));
  }, []);

  const onRetryExercise = useCallback((exerciseId: ExerciseId) => {
    setAnswers((prev) => ({ ...prev, [exerciseId]: "" }));
    setCorrectMap((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setFeedback((prev) => ({ ...prev, [exerciseId]: "" }));
  }, []);

  const onRevealHint = useCallback((exerciseId: ExerciseId) => {
    setHintUsed((prev) => ({ ...prev, [exerciseId]: true }));
  }, []);

  const setFocusRef = useCallback(() => {
    // Focus is not chained across review items; intentional no-op.
  }, []);

  const onNextInput = useCallback(() => {
    // No auto-advance in the ephemeral review block.
  }, []);

  const onSubmitExercise = useCallback(
    (exercise: Exercise) => {
      const userAnswer = answersRef.current[exercise.id] ?? "";
      const previousAttempts = attemptsRef.current[exercise.id] ?? 0;
      const normalized = normalizeAnswerValue(userAnswer);

      if (normalized === null) {
        setCorrectMap((prev) => ({ ...prev, [exercise.id]: false }));
        setFeedback((prev) => ({
          ...prev,
          [exercise.id]: getRetryFeedbackText(exercise, userAnswer, previousAttempts),
        }));
        setWrongAttempts((prev) => ({
          ...prev,
          [exercise.id]: (wrongAttemptsRef.current[exercise.id] ?? 0) + 1,
        }));
        return;
      }

      const success = isAnswerCorrect(exercise, userAnswer);
      const nextAttempt = previousAttempts + 1;

      if (!success) {
        setWrongAttempts((prev) => ({
          ...prev,
          [exercise.id]: (wrongAttemptsRef.current[exercise.id] ?? 0) + 1,
        }));
      }
      setCorrectMap((prev) => ({ ...prev, [exercise.id]: success }));
      setAttempts((prev) => ({ ...prev, [exercise.id]: nextAttempt }));
      setFeedback((prev) => ({
        ...prev,
        [exercise.id]: getRetryFeedbackText(exercise, userAnswer, nextAttempt),
      }));

      // Persist ONLY to the review SR overlay — never the day's progress state.
      record(exercise.id as ExerciseId, success);
    },
    [record],
  );

  if (!isHydrated || candidates.length === 0) {
    return null;
  }

  const rootId = testIds.screen.section.spiralReview.root(grade, dayId, sectionId);
  const headerId = testIds.screen.section.spiralReview.header(grade, dayId, sectionId);

  return (
    <section
      data-testid={rootId}
      dir="rtl"
      className="surface mb-4 rounded-card border-s-rail p-[18px]"
      style={{ borderInlineStartColor: "var(--section-review)" }}
    >
      <div data-testid={headerId} className="mb-3">
        <h2 data-testid={childTid(headerId, "title")} className="text-xl font-bold text-[var(--title)]">
          <span
            data-testid={childTid(headerId, "emoji")}
            className="me-2"
            aria-hidden="true"
            style={{ unicodeBidi: "isolate" }}
          >
            🔁
          </span>
          חֲזָרָה סְפִּירָלִית
        </h2>
        <p data-testid={childTid(headerId, "subtitle")} className="mt-1 text-sm text-[var(--muted)]">
          תַּרְגִּילִים קְצָרִים לְחִזּוּק דְּבָרִים שֶׁכְּבָר לָמַדְנוּ — בְּלִי לְהַשְׁפִּיעַ עַל הַהִתְקַדְּמוּת.
        </p>
      </div>

      <div data-testid={childTid(rootId, "list")} className="flex flex-col gap-3">
        {candidates.map(({ exercise }) => (
          <div
            key={exercise.id}
            data-testid={testIds.screen.section.spiralReview.exercise(grade, dayId, sectionId, exercise.id)}
            className="min-h-[44px]"
          >
            <ExerciseItem
              screenRootTestId={rootId}
              exercise={exercise}
              value={answers[exercise.id] ?? ""}
              retryMessage={feedback[exercise.id]}
              isCorrect={correctMap[exercise.id]}
              wasChecked={(attempts[exercise.id] ?? 0) > 0}
              showCheckButton
              grade={grade}
              setFocusRef={setFocusRef}
              wrongAttempts={wrongAttempts[exercise.id] ?? 0}
              hintUsed={hintUsed[exercise.id] ?? false}
              onRevealHint={onRevealHint}
              onChangeValue={onChangeValue}
              onSubmitExercise={onSubmitExercise}
              onNextInput={onNextInput}
              onRetryExercise={onRetryExercise}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
