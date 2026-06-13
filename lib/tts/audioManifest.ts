import manifestData from "@/lib/tts/audioManifest.data.json";
import type { SpeakLang } from "@/lib/tts/engine";

/**
 * Build-time audio manifest: maps a spoken string (already normalized exactly as the
 * engine speaks it) + language to a pre-generated audio file URL under `public/audio/`.
 *
 * The manifest is produced offline by `scripts/generate-audio.mjs` (human-run, needs a
 * Google Cloud TTS key) and committed as `audioManifest.data.json`. It ships EMPTY by
 * default, so every lookup misses and the engine falls back to `speechSynthesis`
 * (today's behavior, INV-FALLBACK). Real entries activate file playback once generated.
 */
export type AudioManifest = Record<string, unknown>;

const defaultManifest = manifestData as AudioManifest;

/** FNV-1a 32-bit hash (deterministic, dependency-free) — must match the generator. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Deterministic manifest key for an already-normalized spoken string + language.
 * The generator computes the identical key so build-time and runtime agree.
 */
export function audioManifestKey(spokenText: string, lang: SpeakLang): string {
  return `${lang}:${fnv1a(spokenText)}`;
}

/**
 * Returns the pre-generated audio URL for a spoken string, or `null` on any miss.
 * Fail-safe: never throws; non-string / empty entries are treated as misses so the
 * caller degrades to `speechSynthesis`.
 */
export function lookupAudioUrl(
  spokenText: string,
  lang: SpeakLang,
  source: AudioManifest = defaultManifest,
): string | null {
  try {
    const value = source[audioManifestKey(spokenText, lang)];
    return typeof value === "string" && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
