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

  it("collapses an array past the depth cap to an [Array] marker", () => {
    // The array sits at exactly the depth cap (6): a→b→c→d→e→f(array).
    const deep = { a: { b: { c: { d: { e: { f: [{ password: "leak" }] } } } } } };
    const serialized = JSON.stringify(redactFields(deep));
    expect(serialized).not.toContain("leak");
    expect(serialized).toContain("[Array]");
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

describe("logger.info / logger.warn", () => {
  it("logger.info writes an INFO line via console.log", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      logger.info("started", { userId: "u1" });
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.severity).toBe("INFO");
      expect(payload.message).toBe("started");
      expect(payload.userId).toBe("u1");
    } finally {
      spy.mockRestore();
    }
  });

  it("logger.warn writes a WARNING line via console.warn and still redacts PII", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      logger.warn("heads up", { token: "abc" });
      expect(spy).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.severity).toBe("WARNING");
      expect(payload.token).toBe("[REDACTED]");
    } finally {
      spy.mockRestore();
    }
  });

  it("works with no fields argument", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      logger.info("bare");
      const payload = JSON.parse(spy.mock.calls[0][0] as string) as Record<string, unknown>;
      expect(payload.message).toBe("bare");
      expect(payload.severity).toBe("INFO");
    } finally {
      spy.mockRestore();
    }
  });
});
