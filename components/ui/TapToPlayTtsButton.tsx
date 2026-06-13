"use client";

import { SpeakerButton } from "@/components/ui/SpeakerButton";

type TapToPlayTtsButtonProps = {
  /** Single utterance (exercise prompts). Ignored when `chunks` is set. */
  text?: string;
  /** Primer: one chunk per summary/step with pauses between. */
  chunks?: string[];
  dataTestId: string;
  /** Screen reader label when idle */
  ariaLabel?: string;
  /** Screen reader label while audio is playing (stop) */
  ariaLabelSpeaking?: string;
};

/**
 * Hebrew (math layer) preset of {@link SpeakerButton}: icon-only, tap-to-play.
 * Tap is always available when speech synthesis is supported — it is no longer
 * gated on the admin TTS preference (that pref only governs auto-play).
 */
export function TapToPlayTtsButton({
  text = "",
  chunks,
  dataTestId,
  ariaLabel,
  ariaLabelSpeaking,
}: TapToPlayTtsButtonProps) {
  return (
    <SpeakerButton
      lang="he"
      appearance="icon"
      text={text}
      chunks={chunks}
      dataTestId={dataTestId}
      ariaLabel={ariaLabel}
      ariaLabelSpeaking={ariaLabelSpeaking}
    />
  );
}
