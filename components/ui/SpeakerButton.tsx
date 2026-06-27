"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { childTid } from "@/lib/testIds";
import {
  isEnglishVoiceAvailable,
  isTtsSupported,
  speakEnglish,
  speakHebrew,
  speakHebrewChunks,
  stopSpeech,
} from "@/lib/tts/engine";

export type SpeakerLang = "he" | "en";
export type SpeakerAppearance = "icon" | "labeled";

type SpeakerButtonProps = {
  /** Spoken language. "he" → math layer (Hebrew), "en" → English layer. */
  lang: SpeakerLang;
  /** Single utterance. Ignored when `chunks` is set. */
  text?: string;
  /** One chunk per summary/step with pauses between (Hebrew worked examples / primer). */
  chunks?: string[];
  dataTestId: string;
  /** "icon" → icon-only (math). "labeled" → 🔊 + visible label pill (English). */
  appearance?: SpeakerAppearance;
  /** Auto-speak once on mount (listening-first English prompts). */
  autoPlay?: boolean;
  /** Visible label (labeled appearance only). */
  label?: string;
  /** Sizing for the labeled appearance. */
  size?: "sm" | "lg";
  /** Screen reader label when idle (icon appearance). */
  ariaLabel?: string;
  /** Screen reader label while audio is playing (icon appearance). */
  ariaLabelSpeaking?: string;
  "data-exercise-focus"?: "true";
};

const DEFAULT_ARIA_IDLE = "הַשְׁמָעַת הַנְחָיָה";
const DEFAULT_ARIA_SPEAKING = "עֲצֹר הַשְׁמָעָה";

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

/**
 * Single speaker affordance shared by the math (Hebrew) and English layers.
 * Tap-to-play is always available when a voice exists — it is never gated on the
 * admin TTS preference (that pref only governs auto-play on mount). Functionality
 * differs only by `lang`: Hebrew prompts/chunks vs English words.
 *
 * Availability differs by layer, matching prior behavior:
 *  - "he": hidden entirely when speech synthesis is unsupported.
 *  - "en": stays visible but disabled when no English voice is available
 *    (the printed word remains on screen, so answering is never blocked).
 */
export function SpeakerButton({
  lang,
  text = "",
  chunks,
  dataTestId,
  appearance = "icon",
  autoPlay = false,
  label = "הַשְׁמִיעוּ",
  size = "lg",
  ariaLabel = DEFAULT_ARIA_IDLE,
  ariaLabelSpeaking = DEFAULT_ARIA_SPEAKING,
  ...rest
}: SpeakerButtonProps) {
  const checkAvailable = useCallback(
    () => (lang === "en" ? isEnglishVoiceAvailable() : isTtsSupported()),
    [lang],
  );

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [available, setAvailable] = useState(
    () => typeof window !== "undefined" && checkAvailable(),
  );

  // Voices may populate asynchronously; re-check on mount and on voiceschanged.
  useEffect(() => {
    const sync = () => setAvailable(checkAvailable());
    sync();
    const timer = setTimeout(sync, 300);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.addEventListener("voiceschanged", sync);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.removeEventListener("voiceschanged", sync);
      };
    }
    return () => clearTimeout(timer);
  }, [checkAvailable]);

  // Stop any in-flight speech when the button leaves the screen.
  useEffect(() => {
    const onPageHide = () => {
      stopSpeech();
      setIsSpeaking(false);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      stopSpeech();
      setIsSpeaking(false);
    };
  }, []);

  const speak = useCallback(
    (onDone?: () => void) => {
      if (lang === "en") {
        speakEnglish(text, onDone);
        return;
      }
      if (chunks && chunks.length > 0) {
        speakHebrewChunks(chunks, onDone);
      } else {
        speakHebrew(text, onDone);
      }
    },
    [chunks, lang, text],
  );

  // Auto-speak once on mount (English listening-first prompts).
  const autoPlayedRef = useRef(false);
  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    speak();
  }, [autoPlay, speak]);

  const onClick = useCallback(() => {
    if (!available) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.getVoices();
      } catch {
        // Engine handles unsupported synthesis; keep click path alive.
      }
    }
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speak(() => setIsSpeaking(false));
  }, [available, isSpeaking, speak]);

  // "he": hide when unsupported. "en": stay visible but disabled.
  if (lang === "he" && !available) {
    return null;
  }

  if (appearance === "labeled") {
    return (
      <button
        type="button"
        data-testid={dataTestId}
        data-exercise-focus={rest["data-exercise-focus"]}
        disabled={!available}
        aria-label={`${label}: ${text}`}
        onClick={onClick}
        className={`touch-button inline-flex items-center gap-2 rounded-2xl border-2 border-[#e3e0ec] bg-white text-[#1f2d3a] transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
          size === "lg" ? "min-h-14 px-5 text-2xl" : "min-h-12 px-4 text-xl"
        } ${isSpeaking ? "btn-accent" : ""}`}
      >
        <span data-testid={childTid(dataTestId, "icon")} aria-hidden="true">
          🔊
        </span>
        {label ? (
          <span
            data-testid={childTid(dataTestId, "label")}
            className="text-base font-semibold"
          >
            {label}
          </span>
        ) : null}
      </button>
    );
  }

  const stateClass = !available
    ? "border-[#e5e7eb] bg-[#f1f5f9] text-[#94a3b8] opacity-70 cursor-not-allowed"
    : isSpeaking
      ? "border-[#a78bfa] bg-[#ede9fe] text-[#6d28d9] ring-1 ring-[#cdbff2]"
      : "border-[#e7defb] bg-[#faf7ff] text-[#8b75cc] hover:bg-[#f3effb]";

  return (
    <button
      type="button"
      data-testid={dataTestId}
      data-exercise-focus={rest["data-exercise-focus"]}
      className={`touch-icon-button shrink-0 ${stateClass}`}
      aria-label={isSpeaking ? ariaLabelSpeaking : ariaLabel}
      aria-pressed={isSpeaking}
      aria-disabled={!available}
      disabled={!available}
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
