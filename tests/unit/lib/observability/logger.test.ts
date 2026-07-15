// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

import { logger, redactFields } from "@/lib/observability/logger";

describe("redactFields", () => {
  it("redacts each deny-list key (case-insensitive)", () => {
    const out = redactFields({
      password: "p",
      passwordHash: "h",
      token: "t",
      jwt: "j",
      secret: "s",
      cookie: "c",
      authorization: "a",
      username: "kid",
    });
    for (const key of Object.keys(out)) {
      expect(out[key]).toBe("[REDACTED]");
    }
  });

  it("redacts deny-list keys nested inside plain objects", () => {
    const out = redactFields({ user: { username: "kid", id: "u1" } });
    expect(out.user).toEqual({ username: "[REDACTED]", id: "u1" });
  });

  it("leaves non-sensitive fields intact and passes arrays/primitives through", () => {
    const out = redactFields({ userId: "u1", count: 3, tags: ["a", "b"] });
    expect(out).toEqual({ userId: "u1", count: 3, tags: ["a", "b"] });
  });

  it("does not mutate the caller's input", () => {
    const input = { password: "secret", nested: { token: "t" } };
    const snapshot = JSON.stringify(input);
    redactFields(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("redacts deny-list keys inside array elements", () => {
    const out = redactFields({ users: [{ username: "kid", password: "p", id: "u1" }] });
    expect(out.users).toEqual([{ username: "[REDACTED]", password: "[REDACTED]", id: "u1" }]);
  });

  it("collapses values past the depth cap instead of leaking them unredacted", () => {
    // 7 levels deep (cap is 6) — the deepest object must not appear verbatim.
    const deep = { a: { b: { c: { d: { e: { f: { password: "leak" } } } } } } };
    const serialized = JSON.stringify(redactFields(deep));
    expect(serialized).not.toContain("leak");
    expect(serialized).toContain("[Object]");
  });

  it("is cycle-safe", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    expect(() => redactFields(a)).not.toThrow();
  });
});

describe("logger.error", () => {
  it("calls console.error once with a JSON line carrying ERROR severity and redacting sensitive fields", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      logger.error("boom", { password: "hunter2", userId: "u1" });
      expect(spy).toHaveBeenCalledTimes(1);
      const arg = spy.mock.calls[0][0];
      expect(typeof arg).toBe("string");
      const payload = JSON.parse(arg as string) as Record<string, unknown>;
      expect(payload.severity).toBe("ERROR");
      expect(payload.message).toBe("boom");
      expect(payload.password).toBe("[REDACTED]");
      expect(payload.userId).toBe("u1");
    } finally {
      spy.mockRestore();
    }
  });

  it("does not let a caller field clobber severity/message/time", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      logger.error("real message", { message: "fake", severity: "INFO" });
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.severity).toBe("ERROR");
      expect(payload.message).toBe("real message");
    } finally {
      spy.mockRestore();
    }
  });
});
