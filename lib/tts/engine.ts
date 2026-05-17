import { CHILD_TTS_RATE } from "@/lib/tts/constants";

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

function bumpSpeakGeneration(): void {
  chunkSpeakGeneration += 1;
}

/** User-initiated stop — always clears the synthesis queue. */
export function stopSpeech(): void {
  bumpSpeakGeneration();
  if (!isBrowser() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * Cancel only when audio is active. Unconditional cancel() before speak() on an idle
 * queue is a common Chrome/Safari silent-failure mode.
 */
function cancelActiveSpeechIfNeeded(): boolean {
  if (!isBrowser() || !window.speechSynthesis) return false;
  const synth = window.speechSynthesis;
  if (!synth.speaking && !synth.pending) return false;
  bumpSpeakGeneration();
  synth.cancel();
  return true;
}

function primeSpeechVoices(): void {
  if (!isBrowser() || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    // Some engines throw before voices are ready.
  }
}

function runAfterQueueClear(run: () => void): void {
  const cleared = cancelActiveSpeechIfNeeded();
  if (cleared) {
    queueMicrotask(run);
  } else {
    run();
  }
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

function resumeSynthesis(): void {
  if (!isBrowser() || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.resume();
  } catch {
    // Some engines throw if resume is not needed.
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
  primeSpeechVoices();
  resumeSynthesis();
  window.speechSynthesis!.speak(utterance);
}

export function speakHebrew(text: string, onEnd?: () => void, options?: SpeakOptions): void {
  if (!isBrowser() || !isTtsSupported()) {
    onEnd?.();
    return;
  }
  ensureVoicesLoaded();
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    onEnd?.();
    return;
  }
  runAfterQueueClear(() => {
    speakUtterance(trimmed, options, onEnd);
  });
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

  const chunks = parts.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  if (chunks.length === 0) {
    onEnd?.();
    return;
  }

  const startChunks = () => {
    if (chunks.length === 1) {
      speakUtterance(chunks[0]!, options, onEnd);
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
        speakAt(index + 1);
      });
    };

    speakAt(0);
  };

  runAfterQueueClear(startChunks);
}
