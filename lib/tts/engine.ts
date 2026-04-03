function isBrowser(): boolean {
  return typeof window !== "undefined";
}

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

export function stopSpeech(): void {
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

export function speakHebrew(text: string, onEnd?: () => void): void {
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
  const normalized = normalizeTextForHebrewTts(trimmed);
  const utterance = new SpeechSynthesisUtterance(normalized);
  utterance.lang = "he-IL";
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
  window.speechSynthesis.speak(utterance);
}
