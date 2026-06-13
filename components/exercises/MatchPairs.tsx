"use client";

import { useState } from "react";
import { AudioButton } from "@/components/exercises/AudioButton";
import { childTid, testIds } from "@/lib/testIds";
import type { MatchPairsExercise } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseMapping(value: string): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* fall through */
  }
  return {};
}

interface MatchPairsProps {
  exercise: MatchPairsExercise;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Tap-to-match (English layer). Tap a left item to select it, then tap a right item to
 * connect them (one-to-one). Fully controlled by `value` (a JSON left→right map) so the
 * parent's check/reset flow works. No typing.
 */
export function MatchPairs({ exercise, value, onChange }: MatchPairsProps) {
  const [lefts] = useState(() => shuffle(exercise.pairs.map((p) => p.left)));
  const [rights] = useState(() => shuffle(exercise.pairs.map((p) => p.right)));
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const mapping = parseMapping(value);
  const rightToLeft = new Map<string, string>();
  for (const [l, r] of Object.entries(mapping)) rightToLeft.set(r, l);

  // Stable connection index per matched left (for color/number cue).
  const matchedLefts = lefts.filter((l) => mapping[l]);
  const connectionIndex = new Map<string, number>();
  matchedLefts.forEach((l, i) => connectionIndex.set(l, i + 1));

  const leftDir = exercise.leftLang === "he" ? "rtl" : "ltr";
  const rightDir = exercise.rightLang === "en" ? "ltr" : "rtl";

  const onLeftTap = (left: string) => {
    if (mapping[left]) {
      // Unmatch.
      const next = { ...mapping };
      delete next[left];
      onChange(JSON.stringify(next));
      setActiveLeft(null);
      return;
    }
    setActiveLeft((cur) => (cur === left ? null : left));
  };

  const onRightTap = (right: string) => {
    if (!activeLeft) return;
    const next = { ...mapping };
    // Keep one-to-one: free this right from any prior left.
    const prevOwner = rightToLeft.get(right);
    if (prevOwner) delete next[prevOwner];
    next[activeLeft] = right;
    onChange(JSON.stringify(next));
    setActiveLeft(null);
  };

  const root = childTid(testIds.component.exerciseBox.root(exercise.id), "matchPairs");

  return (
    <div data-testid={root} className="mt-2 grid grid-cols-2 gap-3">
      <div data-testid={childTid(root, "leftCol")} dir={leftDir} className="flex flex-col gap-2">
        {lefts.map((left, index) => {
          const matched = Boolean(mapping[left]);
          const isActive = activeLeft === left;
          const cue = connectionIndex.get(left);
          return (
            <button
              key={left}
              data-testid={testIds.component.exerciseBox.matchLeft(exercise.id, index)}
              data-exercise-focus={index === 0 ? "true" : undefined}
              type="button"
              onClick={() => onLeftTap(left)}
              className={`touch-button flex min-h-12 items-center justify-between gap-2 rounded-2xl border-2 px-3 text-base font-semibold transition-transform hover:scale-105 ${
                matched
                  ? "border-emerald-400 bg-emerald-50"
                  : isActive
                    ? "btn-accent"
                    : "border-slate-200 bg-white"
              }`}
            >
              <span data-testid={childTid(root, "leftLabel", index)}>{left}</span>
              {exercise.audioByLeft?.[left] ? (
                <AudioButton
                  data-testid={childTid(root, "leftAudio", index)}
                  text={exercise.audioByLeft[left]!}
                  label=""
                  size="sm"
                />
              ) : cue ? (
                <span data-testid={childTid(root, "leftCue", index)} className="text-sm font-bold text-emerald-700">
                  {cue}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div data-testid={childTid(root, "rightCol")} dir={rightDir} className="flex flex-col gap-2">
        {rights.map((right, index) => {
          const owner = rightToLeft.get(right);
          const matched = Boolean(owner);
          const cue = owner ? connectionIndex.get(owner) : undefined;
          return (
            <button
              key={right}
              data-testid={testIds.component.exerciseBox.matchRight(exercise.id, index)}
              type="button"
              onClick={() => onRightTap(right)}
              className={`touch-button flex min-h-12 items-center justify-between gap-2 rounded-2xl border-2 px-3 text-base font-semibold transition-transform hover:scale-105 ${
                matched ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <span data-testid={childTid(root, "rightLabel", index)}>{right}</span>
              {cue ? (
                <span data-testid={childTid(root, "rightCue", index)} className="text-sm font-bold text-emerald-700">
                  {cue}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
