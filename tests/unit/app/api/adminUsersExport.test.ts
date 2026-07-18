// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { FakeFirestore } from "./fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { GET as exportUser } from "@/app/api/admin/users/export/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

const ADMIN: AuthUser = { userId: "admin1", username: "Root", role: "admin" };
const NORMAL: AuthUser = { userId: "u2", username: "Kid", role: "user" };
let adminToken: string;
let userToken: string;

function req(opts: { token?: string; userId?: string } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (opts.token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${opts.token}`;
  const qs = opts.userId === undefined ? "" : `?userId=${encodeURIComponent(opts.userId)}`;
  return new NextRequest(`https://kids-math.test/api/admin/users/export${qs}`, {
    method: "GET",
    headers,
  });
}

function seed(userOverrides: Record<string, unknown> = {}): FakeFirestore {
  return new FakeFirestore({
    seed: {
      users: {
        admin1: { username: "Root", usernameLower: "root", passwordHash: "x", role: "admin", createdAt: "2024-01-01" },
        u2: {
          username: "Kid",
          usernameLower: "kid",
          passwordHash: "secret-hash",
          tokenVersion: 3,
          role: "user",
          createdAt: "2024-02-01",
          ...userOverrides,
        },
      },
      user_progress: { u2: { bundleVersion: 4, updatedAt: "2024-06-01" } },
    },
  });
}

describe("/api/admin/users/export", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
    adminToken = await signToken(ADMIN);
    userToken = await signToken(NORMAL);
  });

  beforeEach(() => {
    holder.db = seed();
  });

  describe("authorization gate", () => {
    it("→ 403 without a session", async () => {
      expect((await exportUser(req({ userId: "u2" }))).status).toBe(403);
    });

    it("→ 403 for a non-admin user (NOT self-service)", async () => {
      expect((await exportUser(req({ token: userToken, userId: "u2" }))).status).toBe(403);
    });
  });

  describe("input validation", () => {
    it("→ 400 when userId is missing", async () => {
      expect((await exportUser(req({ token: adminToken }))).status).toBe(400);
    });

    it("→ 400 when userId is blank", async () => {
      expect((await exportUser(req({ token: adminToken, userId: "   " }))).status).toBe(400);
    });

    it("→ 404 for an unknown user", async () => {
      expect((await exportUser(req({ token: adminToken, userId: "ghost" }))).status).toBe(404);
    });
  });

  describe("happy path", () => {
    it("returns the exact allow-listed key set with the progress bundle", async () => {
      const res = await exportUser(req({ token: adminToken, userId: "u2" }));
      expect(res.status).toBe(200);
      const body = (await res.json()) as Record<string, unknown>;
      expect(Object.keys(body).sort()).toEqual([
        "createdAt",
        "progress",
        "role",
        "status",
        "userId",
        "username",
      ]);
      expect(body).toMatchObject({
        userId: "u2",
        username: "Kid",
        role: "user",
        createdAt: "2024-02-01",
        status: "active",
        progress: { bundleVersion: 4, updatedAt: "2024-06-01" },
      });
    });

    it("serializes NO credential fields — asserted on the raw response text", async () => {
      const res = await exportUser(req({ token: adminToken, userId: "u2" }));
      const raw = await res.text();
      expect(raw).not.toContain("passwordHash");
      expect(raw).not.toContain("secret-hash");
      expect(raw).not.toContain("tokenVersion");
      expect(raw).not.toContain("usernameLower");
    });

    it("sets the download headers", async () => {
      const res = await exportUser(req({ token: adminToken, userId: "u2" }));
      expect(res.headers.get("content-type")).toContain("application/json");
      expect(res.headers.get("content-disposition")).toMatch(
        /^attachment; filename="kids-math-export-u2-\d{4}-\d{2}-\d{2}\.json"$/,
      );
      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("exports null progress when the learner never synced", async () => {
      holder.db = new FakeFirestore({ seed: { users: { admin1: { role: "admin" }, u2: { role: "user" } } } });
      const res = await exportUser(req({ token: adminToken, userId: "u2" }));
      expect(res.status).toBe(200);
      expect((await res.json()) as { progress: unknown }).toMatchObject({ progress: null });
    });
  });

  // A guardian asks about a child whose account was already (soft-)deleted — that is the whole
  // point of retaining the doc, so the export must still succeed.
  it("exports a soft-deleted user", async () => {
    holder.db = seed({ status: "deleted" });
    const res = await exportUser(req({ token: adminToken, userId: "u2" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: "deleted", progress: { bundleVersion: 4 } });
  });

  describe("audit log (S9)", () => {
    it("records a user.export row naming the actor and the subject", async () => {
      const db = seed();
      holder.db = db;
      await exportUser(req({ token: adminToken, userId: "u2" }));
      const rows = db.docs("audit_log");
      expect(rows).toHaveLength(1);
      expect(rows[0].data).toMatchObject({
        actorId: ADMIN.userId,
        action: "user.export",
        targetId: "u2",
      });
      expect(typeof rows[0].data.at).toBe("string");
    });

    it("writes no audit row for a refused (403) request", async () => {
      const db = seed();
      holder.db = db;
      await exportUser(req({ token: userToken, userId: "u2" }));
      expect(db.docs("audit_log")).toHaveLength(0);
    });
  });

  it("returns 500 when Firestore throws", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });
    expect((await exportUser(req({ token: adminToken, userId: "u2" }))).status).toBe(500);
  });
});
