import { type NextRequest } from "next/server";

/**
 * Request-body size caps (roadmap S5 / Phase 0.4).
 *
 * These guard against oversized/DoS payloads *before* JSON parsing. The check reads
 * the declared `Content-Length`; a request without one is allowed through (Next's
 * runtime still bounds the actual read), so this is a cheap first line, not the only
 * one.
 */

/**
 * Progress-push cap. Firestore already rejects any stored document larger than ~1 MiB,
 * so every `user_progress` bundle that has ever synced successfully is already below
 * that ceiling. Sitting just under it means this cap only ever catches abusive bodies,
 * never a long-time student's legitimately accumulated progress. See the roadmap's
 * "Backward compatibility & safe rollout" note — on the progress route this cap is
 * additionally staged (shadow-log first) so nothing is rejected before real traffic
 * confirms it is safe.
 */
export const PROGRESS_MAX_BODY_BYTES = 1_000_000;

/** Login bodies are tiny (`{username, password}`); no accumulated user data rides here. */
export const LOGIN_MAX_BODY_BYTES = 4 * 1024;

/**
 * True when the request declares a `Content-Length` over `maxBytes`. Absent/unparseable
 * length ⇒ false (allow through). Never throws.
 */
export function isBodyTooLarge(request: NextRequest, maxBytes: number): boolean {
  const header = request.headers.get("content-length");
  if (!header) return false;
  const length = Number(header);
  if (!Number.isFinite(length)) return false;
  return length > maxBytes;
}
