/**
 * Deterministic seeded randomness shared across the app (exam/challenge pickers
 * and content generation). Seeding from a stable string key gives a repeatable
 * stream, so the same seed always produces the same shuffle/selection.
 *
 * NOTE: the exact algorithms here are load-bearing — the final-exam, GMAT,
 * science, and English pickers rely on this precise output to keep each learner's
 * question selection stable across deploys. Do not change the hash/PRNG bodies.
 */

/** FNV-1a 32-bit string hash → uint32 seed. */
export function hashStringToUint32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 PRNG — deterministic float stream in [0, 1) from a uint32 seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
