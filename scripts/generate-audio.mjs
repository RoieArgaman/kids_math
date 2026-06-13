#!/usr/bin/env node
/**
 * Build-time audio generator (Case A of docs/AI_MIGRATION_PLAN.md).
 *
 * HUMAN-RUN, OFFLINE. Never invoked by `next build` / CI. Requires a Google Cloud TTS
 * key in `.env.local` (GCP_TTS_CREDENTIALS_JSON — reuse the existing service account).
 *
 * What it does:
 *   1. Collects the FIXED strings the app speaks: English `audioText` from the English
 *      workbook + authored Hebrew (teaching-primer catalog + day summaries/steps).
 *   2. Synthesizes each via Google Cloud TTS (he-IL / en-US neural voices).
 *   3. Writes mp3 files to `public/audio/<key>.mp3` and the lookup map to
 *      `lib/tts/audioManifest.data.json`.
 *
 * Keys are computed with the SAME fnv1a(`${lang}:${spokenText}`) as the runtime
 * (lib/tts/audioManifest.ts). The spoken string must be normalized identically to the
 * engine: English as-is; Hebrew via normalizeTextForHebrewTts.
 *
 * Procedural math prompts are NOT generated (combinatorial) — they stay on
 * `speechSynthesis` at runtime by design.
 *
 * Usage:
 *   node --env-file=.env.local scripts/generate-audio.mjs           # generate all
 *   node --env-file=.env.local scripts/generate-audio.mjs --dry-run # list strings only
 *
 * This file is intentionally provider-agnostic scaffolding: wire the actual Google Cloud
 * TTS REST/SDK call inside `synthesize()` before first use. It must NOT contain secrets.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AUDIO_DIR = join(ROOT, "public", "audio");
const MANIFEST_PATH = join(ROOT, "lib", "tts", "audioManifest.data.json");

const DRY_RUN = process.argv.includes("--dry-run");

/** FNV-1a 32-bit — MUST match lib/tts/audioManifest.ts. */
function fnv1a(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const manifestKey = (spokenText, lang) => `${lang}:${fnv1a(spokenText)}`;

/**
 * Collect { spokenText, lang } pairs for every FIXED string the app speaks.
 * NOTE: import the TS sources via a build step or a small extraction here. Kept as a
 * documented stub so the script is committed without pulling a TS loader into CI.
 */
async function collectStrings() {
  // TODO(human-run): populate from lib/content/english/* (audioText, lang "en")
  // and lib/content/teachingPrimerCatalog.ts + day teachingSummary/steps (lang "he",
  // normalized via normalizeTextForHebrewTts). Return an array of { spokenText, lang }.
  return [];
}

/**
 * Synthesize one string to an mp3 Buffer via Google Cloud TTS.
 * Wire the real call here using GCP_TTS_CREDENTIALS_JSON from process.env.
 */
async function synthesize(_spokenText, _lang) {
  throw new Error(
    "generate-audio: synthesize() not wired. Add the Google Cloud TTS call before running.",
  );
}

async function main() {
  const strings = await collectStrings();
  console.log(`[generate-audio] ${strings.length} fixed strings collected.`);

  if (DRY_RUN) {
    for (const { spokenText, lang } of strings) {
      console.log(`  [${lang}] ${manifestKey(spokenText, lang)}  ${spokenText}`);
    }
    return;
  }

  await mkdir(AUDIO_DIR, { recursive: true });
  const manifest = {};
  for (const { spokenText, lang } of strings) {
    const key = manifestKey(spokenText, lang);
    const buf = await synthesize(spokenText, lang);
    const file = `${key}.mp3`;
    await writeFile(join(AUDIO_DIR, file), buf);
    manifest[key] = `/audio/${file}`;
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[generate-audio] wrote ${Object.keys(manifest).length} entries → ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
