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
});
