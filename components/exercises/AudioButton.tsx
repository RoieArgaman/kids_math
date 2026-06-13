"use client";

import { SpeakerButton } from "@/components/ui/SpeakerButton";

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
 * English (English layer) preset of {@link SpeakerButton}: 🔊 + visible label.
 * Degrades gracefully — when no English voice is available it stays visible but
 * disabled (never blocks answering; the printed word remains on screen).
 */
export function AudioButton({
  text,
  label = "הַשְׁמִיעוּ",
  autoPlay = false,
  size = "lg",
  ...rest
}: AudioButtonProps) {
  return (
    <SpeakerButton
      lang="en"
      appearance="labeled"
      text={text}
      label={label}
      autoPlay={autoPlay}
      size={size}
      dataTestId={rest["data-testid"]}
      data-exercise-focus={rest["data-exercise-focus"]}
    />
  );
}
