// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { FakeFirestore } from "./fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import {
  GET as listUsers,
  POST as createUser,
  PATCH as resetPassword,
  DELETE as deleteUser,
} from "@/app/api/admin/users/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import { checkLockout, recordFailedAttempt, LOCKOUT_MAX_FAILURES } from "@/lib/security/accountLockout";
import type { AuthUser } from "@/lib/auth/types";

const ADMIN: AuthUser = { userId: "admin1", username: "Root", role: "admin" };
const NORMAL: AuthUser = { userId: "u2", username: "Kid", role: "user" };
let adminToken: string;
let userToken: string;

type Method = "GET" | "POST" | "PATCH" | "DELETE";
function req(method: Method, opts: { token?: string; body?: unknown } = {}): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${opts.token}`;
  return new NextRequest("https://kids-math.test/api/admin/users", {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

function seed(): FakeFirestore {
  return new FakeFirestore({
    seed: {
      users: {
        admin1: { username: "Root", usernameLower: "root", passwordHash: "x", role: "admin", createdAt: "2024-01-01" },
        u2: { username: "Kid", usernameLower: "kid", passwordHash: "secret-hash", role: "user", createdAt: "2024-02-01" },
      },
    },
  });
}

describe("/api/admin/users", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
    adminToken = await signToken(ADMIN);
    userToken = await signToken(NORMAL);
  });

  beforeEach(() => {
    holder.db = seed();
  });

  describe("authorization gate", () => {
    it.each<[string, Method]>([
      ["GET", "GET"],
      ["POST", "POST"],
      ["PATCH", "PATCH"],
      ["DELETE", "DELETE"],
    ])("%s → 403 without a token", async (_label, method) => {
      const handler = { GET: listUsers, POST: createUser, PATCH: resetPassword, DELETE: deleteUser }[method];
      expect((await handler(req(method))).status).toBe(403);
    });

    it("GET → 403 for a non-admin user", async () => {
      expect((await listUsers(req("GET", { token: userToken }))).status).toBe(403);
    });
  });

  describe("GET (list)", () => {
    it("returns users without passwordHash", async () => {
      const res = await listUsers(req("GET", { token: adminToken }));
      expect(res.status).toBe(200);
      const users = (await res.json()) as Array<Record<string, unknown>>;
      expect(users.length).toBe(2);
      for (const u of users) {
        expect(u).not.toHaveProperty("passwordHash");
        expect(u).toHaveProperty("userId");
      }
    });

    it("returns 500 when Firestore throws", async () => {
      holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });
      expect((await listUsers(req("GET", { token: adminToken }))).status).toBe(500);
    });
  });

  describe("POST (create)", () => {
    it("creates a new user (defaults role to 'user') → 201", async () => {
      const db = seed();
      holder.db = db;
      const res = await createUser(req("POST", { token: adminToken, body: { username: "Amit", password: "pw123456" } }));
      expect(res.status).toBe(201);
      const json = (await res.json()) as { username: string; role: string };
      expect(json).toMatchObject({ username: "Amit", role: "user" });
      // Password is stored hashed, never in plaintext.
      const stored = db.docs("users").find((d) => d.data.usernameLower === "amit")!;
      expect(stored.data.passwordHash).not.toBe("pw123456");
    });

    it("honors an explicit admin role", async () => {
      const res = await createUser(
        req("POST", { token: adminToken, body: { username: "Boss", password: "pw123456", role: "admin" } }),
      );
      expect(((await res.json()) as { role: string }).role).toBe("admin");
    });

    it("rejects a duplicate username with 409", async () => {
      const res = await createUser(req("POST", { token: adminToken, body: { username: "kid", password: "pw123456" } }));
      expect(res.status).toBe(409);
    });

    it("rejects a missing password with 400", async () => {
      expect(
        (await createUser(req("POST", { token: adminToken, body: { username: "Amit" } }))).status,
      ).toBe(400);
    });

    it("rejects a whitespace-only username with 400", async () => {
      expect(
        (await createUser(req("POST", { token: adminToken, body: { username: "   ", password: "pw123456" } }))).status,
      ).toBe(400);
    });
  });

  describe("PATCH (reset password)", () => {
    it("updates the password hash for an existing user", async () => {
      const db = seed();
      holder.db = db;
      const res = await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", password: "newpass123" } }));
      expect(res.status).toBe(200);
      const stored = db.docs("users").find((d) => d.id === "u2")!;
      expect(stored.data.passwordHash).not.toBe("secret-hash");
      expect(stored.data.passwordHash).not.toBe("newpass123");
    });

    it("returns 404 for an unknown user", async () => {
      const res = await resetPassword(req("PATCH", { token: adminToken, body: { userId: "ghost", password: "newpass123" } }));
      expect(res.status).toBe(404);
    });

    it("returns 400 for a malformed body", async () => {
      expect((await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2" } }))).status).toBe(400);
    });

    it("rejects a weak password with 400 (policy)", async () => {
      const res = await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", password: "123" } }));
      expect(res.status).toBe(400);
    });

    it("allows a simple/PIN password when overridePolicy is set", async () => {
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", password: "1234", overridePolicy: true } }),
      );
      expect(res.status).toBe(200);
    });

    it("bumps tokenVersion and revokes the reset user's existing sessions", async () => {
      const db = seed();
      holder.db = db;
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", password: "newpass123" } }));
      expect(db.docs("users").find((d) => d.id === "u2")!.data.tokenVersion).toBe(1);
    });

    it("clears an active lockout on password reset", async () => {
      // Lock 'kid' (u2), then reset their password → lockout cleared.
      for (let i = 0; i < LOCKOUT_MAX_FAILURES; i++) await recordFailedAttempt("kid");
      expect((await checkLockout("kid")).locked).toBe(true);
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", password: "newpass123" } }));
      expect((await checkLockout("kid")).locked).toBe(false);
    });

    it("unlock action clears the lockout without touching the password", async () => {
      const db = seed();
      holder.db = db;
      for (let i = 0; i < LOCKOUT_MAX_FAILURES; i++) await recordFailedAttempt("kid");
      expect((await checkLockout("kid")).locked).toBe(true);
      const res = await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", action: "unlock" } }));
      expect(res.status).toBe(200);
      expect((await checkLockout("kid")).locked).toBe(false);
      // Password hash unchanged by an unlock.
      expect(db.docs("users").find((d) => d.id === "u2")!.data.passwordHash).toBe("secret-hash");
    });
  });

  describe("session revocation on the admin surface (S4)", () => {
    it("rejects the old admin token after that admin resets their own password", async () => {
      const db = seed();
      holder.db = db;
      // Reset own password → admin1.tokenVersion 0 → 1.
      const reset = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "admin1", password: "newadmin123" } }),
      );
      expect(reset.status).toBe(200);
      // The old adminToken (v0) is now stale → subsequent admin calls are forbidden.
      expect((await listUsers(req("GET", { token: adminToken }))).status).toBe(403);
    });
  });

  describe("DELETE", () => {
    it("deletes a user and cascades their progress doc", async () => {
      const db = new FakeFirestore({
        seed: {
          users: { admin1: { role: "admin" }, u2: { role: "user" } },
          user_progress: { u2: { bundleVersion: 4 } },
        },
      });
      holder.db = db;
      const res = await deleteUser(req("DELETE", { token: adminToken, body: { userId: "u2" } }));
      expect(res.status).toBe(200);
      expect(db.docs("users").find((d) => d.id === "u2")).toBeUndefined();
      expect(db.docs("user_progress").find((d) => d.id === "u2")).toBeUndefined();
    });

    it("refuses to let an admin delete their own account → 400", async () => {
      const res = await deleteUser(req("DELETE", { token: adminToken, body: { userId: ADMIN.userId } }));
      expect(res.status).toBe(400);
    });

    it("tolerates deleting a user with no progress doc", async () => {
      const db = new FakeFirestore({ seed: { users: { admin1: { role: "admin" }, u2: { role: "user" } } } });
      holder.db = db;
      const res = await deleteUser(req("DELETE", { token: adminToken, body: { userId: "u2" } }));
      expect(res.status).toBe(200);
    });

    it("returns 400 for a malformed body", async () => {
      expect((await deleteUser(req("DELETE", { token: adminToken, body: {} }))).status).toBe(400);
    });
  });
});
