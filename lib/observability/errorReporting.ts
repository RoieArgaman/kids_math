import { logger } from "./logger";

/**
 * Capture an error for GCP Error Reporting (roadmap sub-PR 2A / Observability).
 *
 * Normalizes any thrown value and forwards it to {@link logger} at ERROR severity with
 * a `stack` field — GCP Error Reporting auto-ingests ERROR-severity log entries that
 * carry a stack trace. PII in `context` is redacted by the logger before it is emitted.
 *
 * SWAP SEAM: this function is the single swap point for the error-reporting backend.
 * To move to Sentry later, replace this body with
 *   `Sentry.captureException(error, { extra: context });`
 * without touching any call site.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(message, { ...context, stack });
}
