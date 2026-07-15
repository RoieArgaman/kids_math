/**
 * Structured logging sink (roadmap sub-PR 2A / Observability).
 *
 * Emits ONE single-line JSON object per call so GCP Cloud Logging / Error Reporting
 * on Cloud Run ingests it as a structured entry. This is the ONE sanctioned place in
 * production code where `console.*` is allowed — every other module must route through
 * {@link logger} rather than calling `console` directly.
 *
 * PII SAFETY: this handles children's data. {@link redactFields} is a hard deny-list
 * gate applied to every payload; sensitive keys are replaced with "[REDACTED]" before
 * anything reaches the log sink.
 */

/** Arbitrary structured context attached to a log line. */
export type LogFields = Record<string, unknown>;

/** GCP Cloud Logging severity names. */
type Severity = "INFO" | "WARNING" | "ERROR";

/**
 * Keys (compared case-insensitively) whose values are always replaced with
 * "[REDACTED]" before logging. Hard PII/secret gate — never log these.
 */
const DENY_LIST: ReadonlySet<string> = new Set([
  "password",
  "passwordhash",
  "token",
  "jwt",
  "secret",
  "cookie",
  "authorization",
  "username",
]);

/** Max recursion depth for {@link redactFields}; bounds work on hostile/cyclic-ish input. */
const MAX_DEPTH = 6;

function redactValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  // Primitives (incl. null) are logged as-is.
  if (value === null || typeof value !== "object") return value;
  // Cycle guard: a self-referential context must not recurse forever.
  if (seen.has(value)) return "[Circular]";
  // Depth cap: collapse anything deeper into a marker rather than passing a raw
  // object/array through UNREDACTED (a deny-list key below the cap would otherwise leak).
  if (depth >= MAX_DEPTH) return Array.isArray(value) ? "[Array]" : "[Object]";
  seen.add(value);
  // Arrays: recurse into elements so deny-list keys inside array items are still redacted.
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = DENY_LIST.has(key.toLowerCase()) ? "[REDACTED]" : redactValue(val, depth + 1, seen);
  }
  return out;
}

/**
 * Return a deep copy of `fields` with every deny-list key (case-insensitive) replaced
 * by "[REDACTED]" — at every depth, inside nested objects AND array elements (bounded to
 * {@link MAX_DEPTH}, beyond which a value is collapsed to a "[Object]"/"[Array]" marker so
 * nothing deep leaks unredacted). Cycle-safe. Never mutates the caller's input. Exported
 * for testing.
 */
export function redactFields(fields: LogFields): LogFields {
  return redactValue(fields, 0, new WeakSet()) as LogFields;
}

function emit(severity: Severity, message: string, fields?: LogFields): void {
  // Caller fields go FIRST so the log's own severity/message/time always win — a caller
  // field named "message" or "severity" must not clobber the real values (which would
  // corrupt structured logs and GCP Error Reporting grouping).
  const payload = JSON.stringify({
    ...redactFields(fields ?? {}),
    severity,
    message,
    time: new Date().toISOString(),
  });
  switch (severity) {
    case "INFO":
      // eslint-disable-next-line no-console -- sanctioned structured logging sink (GCP Cloud Logging).
      console.log(payload);
      break;
    case "WARNING":
      // eslint-disable-next-line no-console -- sanctioned structured logging sink (GCP Cloud Logging).
      console.warn(payload);
      break;
    case "ERROR":
      // eslint-disable-next-line no-console -- sanctioned structured logging sink (GCP Cloud Logging).
      console.error(payload);
      break;
  }
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    emit("INFO", message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    emit("WARNING", message, fields);
  },
  error(message: string, fields?: LogFields): void {
    emit("ERROR", message, fields);
  },
};
