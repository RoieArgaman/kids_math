// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "../../app/api/fakeFirestore";

// Swap the shared Firestore accessor for the in-memory fake (same pattern as API tests).
const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import {
  checkRateLimit,
  enforceRateLimit,
  isRateLimitEnforced,
  rateLimitedResponse,
} from "@/lib/security/rateLimit";

afterEach(() => {
  delete process.env.RATE_LIMIT_ENFORCE;
  vi.restoreAllMocks();
});

describe("checkRateLimit (shared fixed-window limiter)", () => {
  beforeEach(() => {
    holder.db = new FakeFirestore();
  });

  it("increments within the window and flags over-threshold (never throws)", async () => {
    const opts = { limit: 3, windowMs: 60_000 };
    const key = "login:1.2.3.4:dana";
    for (let i = 1; i <= 3; i++) {
      const r = await checkRateLimit(key, opts);
      expect(r.allowed).toBe(true);
      expect(r.count).toBe(i);
    }
    const over = await checkRateLimit(key, opts);
    expect(over.allowed).toBe(false);
    expect(over.count).toBe(4);
  });

  it("returns retryAfterMs within the window and writes the expiresAt TTL field", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      const db = new FakeFirestore();
      holder.db = db;
      const r = await checkRateLimit("k", { limit: 5, windowMs: 60_000 });
      expect(r.retryAfterMs).toBe(60_000);
      const stored = db.docs("rate_limits")[0].data;
      expect(typeof stored.expiresAt).toBe("string");
      expect(stored.expiresAt).toBe("2024-01-01T00:01:00.000Z");
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets the count after the window elapses", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      const opts = { limit: 2, windowMs: 60_000 };
      const key = "progress:u1";
      await checkRateLimit(key, opts);
      expect((await checkRateLimit(key, opts)).count).toBe(2);
      vi.setSystemTime(new Date("2024-01-01T00:02:00Z"));
      const fresh = await checkRateLimit(key, opts);
      expect(fresh.count).toBe(1);
      expect(fresh.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks distinct keys independently", async () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect((await checkRateLimit("a", opts)).allowed).toBe(true);
    expect((await checkRateLimit("b", opts)).allowed).toBe(true);
    expect((await checkRateLimit("a", opts)).allowed).toBe(false);
  });

  it("fails OPEN when Firestore is unavailable (never blocks the request)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("firestore down") });
    const r = await checkRateLimit("x", { limit: 1, windowMs: 1000 });
    expect(r.allowed).toBe(true);
    expect(r.count).toBe(0);
    expect(r.retryAfterMs).toBe(0);
  });
});

describe("isRateLimitEnforced", () => {
  it("is false unless RATE_LIMIT_ENFORCE=1", () => {
    expect(isRateLimitEnforced()).toBe(false);
    process.env.RATE_LIMIT_ENFORCE = "0";
    expect(isRateLimitEnforced()).toBe(false);
    process.env.RATE_LIMIT_ENFORCE = "1";
    expect(isRateLimitEnforced()).toBe(true);
  });
});

describe("enforceRateLimit (staged: records always, blocks only when enforcing)", () => {
  beforeEach(() => {
    holder.db = new FakeFirestore();
  });

  it("under threshold: allowed, not blocked, regardless of the flag", async () => {
    process.env.RATE_LIMIT_ENFORCE = "1";
    const d = await enforceRateLimit("k", { limit: 3, windowMs: 60_000 });
    expect(d.allowed).toBe(true);
    expect(d.blocked).toBe(false);
  });

  it("over threshold with the flag OFF: records (shadow log) but does NOT block", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const opts = { limit: 1, windowMs: 60_000 };
    await enforceRateLimit("k", opts); // count 1 — allowed
    const d = await enforceRateLimit("k", opts); // count 2 — over
    expect(d.allowed).toBe(false);
    expect(d.blocked).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("[rate-limit:shadow]");
  });

  it("over threshold with the flag ON: blocks and reports retryAfterMs", async () => {
    process.env.RATE_LIMIT_ENFORCE = "1";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const opts = { limit: 1, windowMs: 60_000 };
    await enforceRateLimit("k", opts); // count 1
    const d = await enforceRateLimit("k", opts); // count 2 — over
    expect(d.blocked).toBe(true);
    expect(d.retryAfterMs).toBeGreaterThan(0);
    expect(String(warn.mock.calls[0][0])).toContain("[rate-limit:enforce]");
  });

  it("fails OPEN even when enforcing: a Firestore outage never blocks", async () => {
    process.env.RATE_LIMIT_ENFORCE = "1";
    holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });
    const d = await enforceRateLimit("k", { limit: 1, windowMs: 1000 });
    expect(d.allowed).toBe(true);
    expect(d.blocked).toBe(false);
  });
});

describe("rateLimitedResponse", () => {
  it("is a 429 with a Retry-After header and a rate_limited body", async () => {
    const res = rateLimitedResponse(4200);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5"); // ceil(4200/1000)
    const body = (await res.json()) as { error: string; retryAfterSeconds: number };
    expect(body.error).toBe("rate_limited");
    expect(body.retryAfterSeconds).toBe(5);
  });

  it("never advertises a retry shorter than 1 second", () => {
    expect(rateLimitedResponse(0).headers.get("Retry-After")).toBe("1");
  });
});
