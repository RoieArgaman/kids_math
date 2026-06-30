/**
 * Shared display formatters. Pure functions, no localized copy leaking into
 * logic — safe to use across RTL screens. Numerals these produce are wrapped
 * in `dir="ltr"` by callers where needed.
 */

/** Friendly Hebrew date (day + short month); "—" when null/unparseable. */
export function formatHebrewDate(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
}

/** Approximate ms → whole minutes, Hebrew unit. */
export function formatMinutes(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  return `${minutes} דק׳`;
}

/** mm:ss clock from a whole-second count; negatives clamp to 0. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
