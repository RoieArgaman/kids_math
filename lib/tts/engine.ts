import { CHILD_TTS_CHUNK_GAP_MS, CHILD_TTS_RATE } from "@/lib/tts/constants";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export type SpeakProfile = "child" | "default";

export type SpeakOptions = {
  profile?: SpeakProfile;
};

export function isTtsSupported(): boolean {
  if (!isBrowser()) return false;
  return Boolean(window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined");
}

function pickHebrewVoice(): SpeechSynthesisVoice | null {
  if (!isBrowser() || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const he =
    voices.find((v) => v.lang?.toLowerCase().startsWith("he")) ??
    voices.find((v) => v.lang?.toLowerCase().includes("he"));
  return he ?? null;
}

let voicesListenerAttached = false;

function ensureVoicesLoaded(): void {
  if (!isBrowser() || !window.speechSynthesis || voicesListenerAttached) return;
  voicesListenerAttached = true;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    // Voices may populate asynchronously on some engines.
  });
}

let chunkSpeakGeneration = 0;
let chunkGapTimer: ReturnType<typeof setTimeout> | null = null;

function clearChunkGapTimer(): void {
  if (chunkGapTimer !== null) {
    clearTimeout(chunkGapTimer);
    chunkGapTimer = null;
  }
}

export function stopSpeech(): void {
  chunkSpeakGeneration += 1;
  clearChunkGapTimer();
  if (!isBrowser() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * Hyphens between Hebrew (incl. niqqud) and a digit are often read as "minus" (e.g. מֵ-1 → "from minus one").
 * Insert a space so engines read "מֵ 1" as "from one".
 */
export function normalizeTextForHebrewTts(text: string): string {
  const dashClass = "[-\\u05BE\\u2212\\u2010-\\u2015]";
  return text.replace(new RegExp(`(?<=[\\u0590-\\u05FF])${dashClass}(?=\\d)`, "g"), " ");
}

function applyProfile(utterance: SpeechSynthesisUtterance, options?: SpeakOptions): void {
  const profile = options?.profile ?? "child";
  if (profile === "child") {
    utterance.rate = CHILD_TTS_RATE;
    utterance.pitch = 1;
  }
}

function speakUtterance(
  text: string,
  options: SpeakOptions | undefined,
  onEnd?: () => void,
): void {
  const normalized = normalizeTextForHebrewTts(text);
  const utterance = new SpeechSynthesisUtterance(normalized);
  utterance.lang = "he-IL";
  applyProfile(utterance, options);
  const voice = pickHebrewVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.onend = () => {
    onEnd?.();
  };
  utterance.onerror = () => {
    onEnd?.();
  };
  window.speechSynthesis!.speak(utterance);
}

export function speakHebrew(text: string, onEnd?: () => void, options?: SpeakOptions): void {
  if (!isBrowser() || !isTtsSupported()) {
    onEnd?.();
    return;
  }
  ensureVoicesLoaded();
  stopSpeech();
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }
  speakUtterance(trimmed, options, onEnd);
}

export function speakHebrewChunks(
  parts: string[],
  onEnd?: () => void,
  options?: SpeakOptions,
): void {
  if (!isBrowser() || !isTtsSupported()) {
    onEnd?.();
    return;
  }
  ensureVoicesLoaded();
  stopSpeech();

  const chunks = parts.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (chunks.length === 0) {
    onEnd?.();
    return;
  }

  const generation = chunkSpeakGeneration;

  const speakAt = (index: number) => {
    if (generation !== chunkSpeakGeneration) return;

    if (index >= chunks.length) {
      onEnd?.();
      return;
    }

    speakUtterance(chunks[index]!, options, () => {
      if (generation !== chunkSpeakGeneration) return;
      if (index + 1 >= chunks.length) {
        onEnd?.();
        return;
      }
      chunkGapTimer = setTimeout(() => {
        chunkGapTimer = null;
        if (generation !== chunkSpeakGeneration) return;
        speakAt(index + 1);
      }, CHILD_TTS_CHUNK_GAP_MS);
    });
  };

  speakAt(0);
}
