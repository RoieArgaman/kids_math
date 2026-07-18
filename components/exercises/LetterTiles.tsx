"use client";

import { useState } from "react";
import { AudioButton } from "@/components/exercises/AudioButton";
import { childTid, testIds } from "@/lib/testIds";
import type { LetterTilesExercise } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface LetterTilesProps {
  exercise: LetterTilesExercise;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Tap-to-build spelling (English layer). The learner assembles the target word
 * from letter tiles by tapping — no keyboard, no free text. Fully controlled by
 * `value` (the assembled string so far) so the parent's check/reset flow works.
 */
export function LetterTiles({ exercise, value, onChange }: LetterTilesProps) {
  const [tiles] = useState<string[]>(
    () => exercise.tiles ?? shuffle(Array.from(exercise.word.toLowerCase())),
  );

  // Mark which tiles are consumed by the current assembled value (handles duplicate letters).
  const used = new Array(tiles.length).fill(false) as boolean[];
  for (const ch of value) {
    const idx = tiles.findIndex((t, i) => !used[i] && t.toLowerCase() === ch.toLowerCase());
    if (idx >= 0) used[idx] = true;
  }

  const appendTile = (index: number) => {
    if (used[index]) return;
    onChange(value + tiles[index]);
  };

  const backspace = () => {
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div data-testid={childTid(testIds.component.exerciseBox.root(exercise.id), "letterTiles")} className="mt-2">
      {exercise.audioText ? (
        <div
          data-testid={childTid(testIds.component.exerciseBox.root(exercise.id), "letterTiles", "audioRow")}
          className="mb-3"
        >
          <AudioButton
            data-testid={testIds.component.exerciseBox.audio(exercise.id)}
            text={exercise.audioText}
            size="sm"
          />
        </div>
      ) : null}

      {/* Assembled word slots (LTR English island inside the RTL shell). */}
      <div
        data-testid={testIds.component.exerciseBox.tileWord(exercise.id)}
        dir="ltr"
        className="mb-3 flex min-h-14 flex-wrap items-center gap-1.5 rounded-2xl border-2 border-dashed border-[#cdbff2] bg-[#faf7ff] p-2"
      >
        {value.length === 0 ? (
          <span
            data-testid={childTid(testIds.component.exerciseBox.tileWord(exercise.id), "placeholder")}
            className="px-2 text-[#b9b2c4]"
          >
            _ _ _
          </span>
        ) : (
          Array.from(value).map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              data-testid={childTid(testIds.component.exerciseBox.tileWord(exercise.id), "slot", i)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl font-bold shadow-xs"
            >
              {ch}
            </span>
          ))
        )}
      </div>

      {/* Available tiles. */}
      <div
        data-testid={childTid(testIds.component.exerciseBox.root(exercise.id), "letterTiles", "tray")}
        dir="ltr"
        className="flex flex-wrap gap-2"
      >
        {tiles.map((tile, index) => (
          <button
            key={`${tile}-${index}`}
            data-testid={testIds.component.exerciseBox.tile(exercise.id, index)}
            data-exercise-focus={index === 0 ? "true" : undefined}
            type="button"
            disabled={used[index]}
            onClick={() => appendTile(index)}
            className="touch-button flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#e3e0ec] bg-white text-[#2c2348] text-2xl font-bold transition-transform hover:scale-[1.03] disabled:opacity-30 disabled:hover:scale-100"
          >
            {tile}
          </button>
        ))}
        <button
          data-testid={testIds.component.exerciseBox.tileBackspace(exercise.id)}
          type="button"
          disabled={value.length === 0}
          onClick={backspace}
          aria-label="מְחִיקַת אוֹת אַחֲרוֹנָה"
          className="touch-button flex h-12 min-w-12 items-center justify-center rounded-xl border-2 border-[#e3e0ec] bg-white text-[#2c2348] text-2xl transition-transform hover:scale-[1.03] disabled:opacity-30 disabled:hover:scale-100"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
