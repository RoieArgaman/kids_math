import { CHILD_TTS_RATE } from "@/lib/tts/constants";
import { lookupAudioUrl } from "@/lib/tts/audioManifest";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export type SpeakProfile = "child" | "default";

export type SpeakLang = "he" | "en";

export type SpeakOptions = {
  profile?: SpeakProfile;
  /** Spoken language. Defaults to Hebrew (the original math layer). */
  lang?: SpeakLang;
};

export function isTtsSupported(): boolean {
  if (!isBrowser()) return false;
  return Boolean(window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined");
}

function pickVoiceForLang(langPrefix: string): SpeechSynthesisVoice | null {
  if (!isBrowser() || !window.speechSynthesis) return null;
  const prefix = langPrefix.toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  // Prefer local (higher quality) voices, then remote; match by lang prefix (he / en).
  const match =
    voices.find((v) => v.localService && v.lang?.toLowerCase().startsWith(prefix)) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ??
    voices.find((v) => v.lang?.toLowerCase().includes(prefix));
  return match ?? null;
}

function pickHebrewVoice(): SpeechSynthesisVoice | null {
  return pickVoiceForLang("he");
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  return pickVoiceForLang("en");
}

/** True when the browser exposes at least one English voice (for graceful audio fallback). */
export function isEnglishVoiceAvailable(): boolean {
  return pickEnglishVoice() !== null;
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

/** Currently-playing pre-generated audio element (manifest path), if any. */
let currentAudio: HTMLAudioElement | null = null;

function bumpSpeakGeneration(): void {
  chunkSpeakGeneration += 1;
}

function stopCurrentAudio(): void {
  if (!currentAudio) return;
  try {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
  } catch {
    // Some engines throw if paused before playback starts.
  }
  currentAudio = null;
}

/** User-initiated stop — always clears the synthesis queue and any manifest audio. */
export function stopSpeech(): void {
  bumpSpeakGeneration();
  stopCurrentAudio();
  if (!isBrowser() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * Cancel only when audio is active. Unconditional cancel() before speak() on an idle
 * queue is a common Chrome/Safari silent-failure mode.
 */
function cancelActiveSpeechIfNeeded(): boolean {
  const hadAudio = currentAudio !== null;
  stopCurrentAudio();
  if (!isBrowser() || !window.speechSynthesis) return hadAudio;
  const synth = window.speechSynthesis;
  if (!synth.speaking && !synth.pending) return hadAudio;
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
 * Normalize Hebrew text for TTS:
 * 1. Replace space-padded math operators with spoken Hebrew words.
 * 2. Fix hyphens between Hebrew letters and digits (read as "minus" on some engines).
 */
export function normalizeTextForHebrewTts(text: string): string {
  let result = text
    .replace(/ \+ /g, " פְּלוּס ")
    .replace(/ = /g, " שָׁוֶה ")
    .replace(/ - /g, " פָּחוֹת ")
    .replace(/×/g, " כָּפוּל ");
  const dashClass = "[-\\u05BE\\u2212\\u2010-\\u2015]";
  result = result.replace(new RegExp(`(?<=[\\u0590-\\u05FF])${dashClass}(?=\\d)`, "g"), " ");
  return result;
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

function speakViaSynthesis(
  normalized: string,
  lang: SpeakLang,
  options: SpeakOptions | undefined,
  onEnd?: () => void,
): void {
  const utterance = new SpeechSynthesisUtterance(normalized);
  utterance.lang = lang === "en" ? "en-US" : "he-IL";
  applyProfile(utterance, options);
  const voice = lang === "en" ? pickEnglishVoice() : pickHebrewVoice();
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

function speakUtterance(
  text: string,
  options: SpeakOptions | undefined,
  onEnd?: () => void,
): void {
  const lang = options?.lang ?? "he";
  const normalized = lang === "en" ? text : normalizeTextForHebrewTts(text);

  // Manifest-first: play pre-generated neural audio when available; fall back to the
  // browser engine on any miss or playback error (INV-FALLBACK → today's behavior).
  const audioUrl = lookupAudioUrl(normalized, lang);
  if (audioUrl && typeof Audio !== "undefined") {
    try {
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      const fallback = () => {
        if (currentAudio === audio) currentAudio = null;
        speakViaSynthesis(normalized, lang, options, onEnd);
      };
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        onEnd?.();
      };
      audio.onerror = fallback;
      const played = audio.play();
      if (played && typeof played.catch === "function") {
        played.catch(fallback);
      }
      return;
    } catch {
      currentAudio = null;
      // fall through to synthesis
    }
  }

  speakViaSynthesis(normalized, lang, options, onEnd);
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

/** Speak English text (English layer). Falls back to a no-op + onEnd when TTS is unavailable. */
export function speakEnglish(text: string, onEnd?: () => void, options?: SpeakOptions): void {
  speakHebrew(text, onEnd, { ...options, lang: "en" });
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
