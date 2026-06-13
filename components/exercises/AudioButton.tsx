"use client";

import { useEffect, useState } from "react";
import { childTid } from "@/lib/testIds";
import { isEnglishVoiceAvailable, speakEnglish } from "@/lib/tts/engine";

interface AudioButtonProps {
  /** English text to speak aloud. */
  text: string;
  "data-testid": string;
  "data-exercise-focus"?: "true";
  /** Visible label next to the speaker icon (Hebrew). Defaults to "הַשְׁמִיעוּ". */
  label?: string;
  /** Auto-speak once on mount (listening-first prompts). */
  autoPlay?: boolean;
  size?: "sm" | "lg";
}

/**
 * Audio-first affordance for the English layer. Speaks `text` via English TTS.
 * Degrades gracefully: when no English voice is available it stays visible but
 * disabled (never blocks answering — the printed word remains on screen).
 */
export function AudioButton({
  text,
  label = "הַשְׁמִיעוּ",
  autoPlay = false,
  size = "lg",
  ...rest
}: AudioButtonProps) {
  const [available, setAvailable] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Voices may populate asynchronously; re-check shortly after mount.
    setAvailable(isEnglishVoiceAvailable());
    const t = setTimeout(() => setAvailable(isEnglishVoiceAvailable()), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    speakEnglish(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPlay = () => {
    setSpeaking(true);
    speakEnglish(text, () => setSpeaking(false));
  };

  return (
    <button
      data-testid={rest["data-testid"]}
      data-exercise-focus={rest["data-exercise-focus"]}
      type="button"
      disabled={!available}
      aria-label={`${label}: ${text}`}
      onClick={onPlay}
      className={`touch-button inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
        size === "lg" ? "min-h-14 px-5 text-2xl" : "min-h-12 px-4 text-xl"
      } ${speaking ? "btn-accent" : ""}`}
    >
      <span data-testid={childTid(rest["data-testid"], "icon")} aria-hidden="true">
        🔊
      </span>
      <span data-testid={childTid(rest["data-testid"], "label")} className="text-base font-semibold">
        {label}
      </span>
    </button>
  );
}
