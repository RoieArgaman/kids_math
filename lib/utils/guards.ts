/**
 * Shared environment/type guards. Extracted byte-for-byte from the storage
 * modules that defined identical local copies (progress, english, science,
 * review, badges, analytics). Modules whose `isBrowser` checks something
 * different (e.g. `typeof window !== "undefined"` only, in admin/tts) keep
 * their own local variant and are intentionally NOT adopted here.
 */

/** True only when running in a browser that exposes `localStorage`. */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Narrow an unknown value to a non-null object record. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
