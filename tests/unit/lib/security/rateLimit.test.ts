// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "../../app/api/fakeFirestore";

// Swap the shared Firestore accessor for the in-memory fake (same pattern as API tests).
const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { checkRateLimit, recordRateLimit } from "@/lib/security/rateLimit";

describe("checkRateLimit (shadow-mode shared limiter)", () => {
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

  it("resets the count after the window elapses", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
      const opts = { limit: 2, windowMs: 60_000 };
      const key = "progress:u1";
      await checkRateLimit(key, opts);
      expect((await checkRateLimit(key, opts)).count).toBe(2);
      // Advance past the window → fresh window, count restarts at 1.
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
  });

  it("recordRateLimit logs on over-threshold and resolves (shadow, never throws)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const opts = { limit: 1, windowMs: 60_000 };
      await recordRateLimit("k", opts); // 1st: allowed, no log
      await recordRateLimit("k", opts); // 2nd: over threshold, logs
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain("[rate-limit:shadow]");
    } finally {
      warn.mockRestore();
    }
  });
});
