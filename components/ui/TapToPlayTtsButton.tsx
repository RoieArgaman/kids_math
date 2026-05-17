"use client";

import { useCallback, useEffect, useState } from "react";
import { childTid } from "@/lib/testIds";
import { isTtsSupported, speakHebrew, speakHebrewChunks, stopSpeech } from "@/lib/tts/engine";

type TapToPlayTtsButtonProps = {
  /** Single utterance (exercise prompts). Ignored when `chunks` is set. */
  text?: string;
  /** Primer: one chunk per summary/step with pauses between. */
  chunks?: string[];
  dataTestId: string;
  featureEnabled: boolean;
  /** Screen reader label when idle */
  ariaLabel?: string;
  /** Screen reader label while audio is playing (stop) */
  ariaLabelSpeaking?: string;
};

const DEFAULT_ARIA_IDLE = "השמעת הנחיה";
const DEFAULT_ARIA_SPEAKING = "עצור השמעה";

function SpeakerIcon({ baseTid }: { baseTid: string }) {
  return (
    <svg
      data-testid={childTid(baseTid, "speaker", "svg")}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      <path
        data-testid={childTid(baseTid, "speaker", "cone")}
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        fill="none"
      />
      <path
        data-testid={childTid(baseTid, "speaker", "waves")}
        d="M15.54 8.46a5 5 0 010 7.07M17.66 6.34a8 8 0 010 11.32"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function StopIcon({ baseTid }: { baseTid: string }) {
  return (
    <svg
      data-testid={childTid(baseTid, "stop", "svg")}
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      <rect
        data-testid={childTid(baseTid, "stop", "mark")}
        x={7}
        y={7}
        width={10}
        height={10}
        rx={1.5}
        fill="currentColor"
      />
    </svg>
  );
}

export function TapToPlayTtsButton({
  text = "",
  chunks,
  dataTestId,
  featureEnabled,
  ariaLabel = DEFAULT_ARIA_IDLE,
  ariaLabelSpeaking = DEFAULT_ARIA_SPEAKING,
}: TapToPlayTtsButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const supported = typeof window !== "undefined" && isTtsSupported();

  useEffect(() => {
    return () => {
      stopSpeech();
      setIsSpeaking(false);
    };
  }, []);

  useEffect(() => {
    const onPageHide = () => {
      stopSpeech();
      setIsSpeaking(false);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  const onClick = useCallback(() => {
    if (!supported || !featureEnabled) return;
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const onDone = () => {
      setIsSpeaking(false);
    };
    if (chunks && chunks.length > 0) {
      speakHebrewChunks(chunks, onDone);
    } else {
      speakHebrew(text, onDone);
    }
  }, [chunks, featureEnabled, isSpeaking, supported, text]);

  if (!featureEnabled || !supported) {
    return null;
  }

  const stateClass = isSpeaking
    ? "border-violet-400 bg-violet-100 text-violet-900 shadow-sm ring-1 ring-violet-300/80"
    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      data-testid={dataTestId}
      className={`touch-icon-button shrink-0 ${stateClass}`}
      aria-label={isSpeaking ? ariaLabelSpeaking : ariaLabel}
      aria-pressed={isSpeaking}
      onClick={onClick}
    >
      <span
        className="inline-flex items-center justify-center"
        data-testid={childTid(dataTestId, "icon")}
        dir="ltr"
      >
        {isSpeaking ? <StopIcon baseTid={dataTestId} /> : <SpeakerIcon baseTid={dataTestId} />}
      </span>
    </button>
  );
}
