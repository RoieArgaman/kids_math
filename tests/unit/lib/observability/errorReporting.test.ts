// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

import { captureError } from "@/lib/observability/errorReporting";

describe("captureError", () => {
  it("logs an Error at ERROR severity with a stack and redacted PII context", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      captureError(new Error("boom"), { username: "kid", userId: "u1" });
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.severity).toBe("ERROR");
      expect(payload.message).toBe("boom");
      expect(typeof payload.stack).toBe("string");
      expect(payload.username).toBe("[REDACTED]");
      expect(payload.userId).toBe("u1");
    } finally {
      spy.mockRestore();
    }
  });

  it("handles a non-Error thrown value: message is stringified and there is no stack", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      captureError("plain failure", { route: "GET /x" });
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.severity).toBe("ERROR");
      expect(payload.message).toBe("plain failure");
      expect(payload.stack).toBeUndefined();
      expect(payload.route).toBe("GET /x");
    } finally {
      spy.mockRestore();
    }
  });

  it("works with no context argument", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      captureError(new Error("bare"));
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.message).toBe("bare");
      expect(typeof payload.stack).toBe("string");
    } finally {
      spy.mockRestore();
    }
  });
});
