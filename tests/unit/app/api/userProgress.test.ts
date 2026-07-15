// @vitest-environment node
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";

import { FakeFirestore } from "./fakeFirestore";
import type { UserProgressBundle } from "@/lib/user-data/types";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { GET as getProgress, POST as postProgress } from "@/app/api/user/progress/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

const USER: AuthUser = { userId: "u1", username: "Dana", role: "user" };
let token: string;

function makeBundle(overrides: Partial<UserProgressBundle> = {}): UserProgressBundle {
  return {
    bundleVersion: 4,
    updatedAt: "2024-01-01T00:00:00.000Z",
    streak: null,
    grades: {
      a: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
      b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
    },
    ...overrides,
  } as UserProgressBundle;
}

function req(
  method: "GET" | "POST",
  opts: { token?: string; body?: unknown; contentLength?: number } = {},
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${opts.token}`;
  if (opts.contentLength !== undefined) headers["content-length"] = String(opts.contentLength);
  return new NextRequest("https://kids-math.test/api/user/progress", {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

// The route version-checks the session (S4), which reads users/{userId}. So every valid-session
// test needs a users/u1 doc; helper seeds it (tokenVersion absent ⇒ 0, matches a v0 token).
function makeDb(
  seed: Record<string, Record<string, Record<string, unknown>>> = {},
): FakeFirestore {
  return new FakeFirestore({ seed: { users: { u1: { username: "Dana", role: "user" } }, ...seed } });
}

describe("/api/user/progress", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
    token = await signToken(USER);
  });

  beforeEach(() => {
    holder.db = makeDb();
  });

  describe("auth gating", () => {
    it("GET → 401 without a token", async () => {
      expect((await getProgress(req("GET"))).status).toBe(401);
    });
    it("GET → 401 with an invalid token", async () => {
      expect((await getProgress(req("GET", { token: "garbage" }))).status).toBe(401);
    });
    it("POST → 401 without a token", async () => {
      expect((await postProgress(req("POST", { body: makeBundle() }))).status).toBe(401);
    });

    // Roadmap S4: a revoked session (stored tokenVersion bumped past the token) is refused
    // on both read and write — this is what makes a password reset / "log out everywhere" bite.
    it("GET → 401 for a REVOKED token", async () => {
      // Stored version bumped to 1; the v0 token no longer matches.
      holder.db = new FakeFirestore({
        seed: { users: { u1: { username: "Dana", role: "user", tokenVersion: 1 } } },
      });
      expect((await getProgress(req("GET", { token }))).status).toBe(401);
    });

    it("POST → 401 for a REVOKED token", async () => {
      holder.db = new FakeFirestore({
        seed: { users: { u1: { username: "Dana", role: "user", tokenVersion: 1 } } },
      });
      expect((await postProgress(req("POST", { token, body: makeBundle() }))).status).toBe(401);
    });
  });

  describe("GET", () => {
    it("returns null when the user has no stored progress doc", async () => {
      const res = await getProgress(req("GET", { token }));
      expect(res.status).toBe(200);
      expect(await res.json()).toBeNull();
    });

    it("returns the stored bundle when present", async () => {
      holder.db = makeDb({ user_progress: { u1: makeBundle({ updatedAt: "2024-05-05T00:00:00.000Z" }) } });
      const res = await getProgress(req("GET", { token }));
      const json = (await res.json()) as UserProgressBundle;
      expect(json.updatedAt).toBe("2024-05-05T00:00:00.000Z");
    });

    it("returns 500 when Firestore throws", async () => {
      holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });
      const res = await getProgress(req("GET", { token }));
      expect(res.status).toBe(500);
    });
  });

  describe("POST", () => {
    it.each([1, 2, 3, 4])("accepts bundleVersion %i", async (v) => {
      const res = await postProgress(
        req("POST", { token, body: makeBundle({ bundleVersion: v as 1 | 2 | 3 | 4 }) }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });

    it("rejects an unknown bundleVersion with 400", async () => {
      const res = await postProgress(req("POST", { token, body: { bundleVersion: 99 } }));
      expect(res.status).toBe(400);
    });

    it("rejects a non-object body with 400", async () => {
      const res = await postProgress(req("POST", { token, body: "nope" }));
      expect(res.status).toBe(400);
    });

    it("persists the merged bundle and stamps a fresh updatedAt", async () => {
      const db = makeDb();
      holder.db = db;
      await postProgress(req("POST", { token, body: makeBundle() }));
      const stored = db.docs("user_progress").find((d) => d.id === "u1");
      expect(stored).toBeDefined();
      expect(typeof (stored!.data as UserProgressBundle).updatedAt).toBe("string");
    });

    it("merges with an existing doc rather than clobbering it (transaction path)", async () => {
      // Existing has a newer streak; incoming has none. Merge must keep the newer streak.
      const existing = makeBundle({
        updatedAt: "2024-06-01T00:00:00.000Z",
        streak: {
          version: 1,
          currentStreak: 7,
          longestStreak: 7,
          lastActiveDate: "2024-06-01",
          updatedAt: "2024-06-01T00:00:00.000Z",
        } as unknown as UserProgressBundle["streak"],
      });
      const db = makeDb({ user_progress: { u1: existing } });
      holder.db = db;
      const res = await postProgress(req("POST", { token, body: makeBundle({ streak: null }) }));
      expect(res.status).toBe(200);
      const stored = db.docs("user_progress").find((d) => d.id === "u1")!.data as UserProgressBundle;
      expect(stored.streak?.currentStreak).toBe(7);
    });

    it("clamps a future-dated incoming timestamp before storing", async () => {
      const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
      const db = makeDb();
      holder.db = db;
      await postProgress(req("POST", { token, body: makeBundle({ updatedAt: future }) }));
      const stored = db.docs("user_progress").find((d) => d.id === "u1")!.data as UserProgressBundle;
      // Route stamps its own updatedAt (now), never the far-future one.
      expect(new Date(stored.updatedAt).getTime()).toBeLessThan(new Date(future).getTime());
    });

    it("returns 500 when the transaction fails", async () => {
      holder.db = new FakeFirestore({ throwOnAccess: new Error("txn boom") });
      const res = await postProgress(req("POST", { token, body: makeBundle() }));
      expect(res.status).toBe(500);
    });
  });

  // Roadmap S5 body cap, staged. Backward compat: while enforcement is OFF (default) a
  // large but legitimate accumulated bundle must still merge — never 413'd — so no
  // long-time student is stranded. Enforcement only rejects once explicitly enabled.
  describe("body size cap (staged)", () => {
    const OVER_CAP = 2_000_000; // > PROGRESS_MAX_BODY_BYTES (1_000_000)

    it("shadow default: over-cap body still returns 200 and merges (no 413)", async () => {
      const db = makeDb();
      holder.db = db;
      const res = await postProgress(
        req("POST", { token, body: makeBundle(), contentLength: OVER_CAP }),
      );
      expect(res.status).toBe(200);
      expect(db.docs("user_progress").find((d) => d.id === "u1")).toBeDefined();
    });

    it("enforce on: over-cap body returns 413 before parsing", async () => {
      const prev = process.env.PROGRESS_BODY_CAP_ENFORCE;
      process.env.PROGRESS_BODY_CAP_ENFORCE = "1";
      try {
        const res = await postProgress(
          req("POST", { token, body: makeBundle(), contentLength: OVER_CAP }),
        );
        expect(res.status).toBe(413);
      } finally {
        if (prev === undefined) delete process.env.PROGRESS_BODY_CAP_ENFORCE;
        else process.env.PROGRESS_BODY_CAP_ENFORCE = prev;
      }
    });

    it("enforce on: a normal (< cap) bundle is unaffected", async () => {
      const prev = process.env.PROGRESS_BODY_CAP_ENFORCE;
      process.env.PROGRESS_BODY_CAP_ENFORCE = "1";
      try {
        const res = await postProgress(
          req("POST", { token, body: makeBundle(), contentLength: 500 }),
        );
        expect(res.status).toBe(200);
      } finally {
        if (prev === undefined) delete process.env.PROGRESS_BODY_CAP_ENFORCE;
        else process.env.PROGRESS_BODY_CAP_ENFORCE = prev;
      }
    });
  });

  describe("rate limiting (staged enforce, S1 / Phase 2.7)", () => {
    const rlDoc = (key: string) => createHash("sha256").update(key).digest("hex");
    const PROGRESS_KEY = "progress:u1"; // userId-keyed

    afterEach(() => {
      delete process.env.RATE_LIMIT_ENFORCE;
    });

    it("returns 429 when over threshold and RATE_LIMIT_ENFORCE=1", async () => {
      process.env.RATE_LIMIT_ENFORCE = "1";
      vi.spyOn(console, "warn").mockImplementation(() => {});
      // Seed the limiter doc at the threshold (60) so the next push goes over.
      holder.db = makeDb({ rate_limits: { [rlDoc(PROGRESS_KEY)]: { count: 60, windowStart: Date.now() } } });
      const res = await postProgress(req("POST", { token, body: makeBundle() }));
      expect(res.status).toBe(429);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("rate_limited");
    });

    it("does NOT block a normal push when under threshold", async () => {
      process.env.RATE_LIMIT_ENFORCE = "1";
      holder.db = makeDb();
      const res = await postProgress(req("POST", { token, body: makeBundle() }));
      expect(res.status).toBe(200);
    });
  });
});
