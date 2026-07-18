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

  // Production reality, not a fake artifact: `orderBy("createdAt")` omits docs lacking the field,
  // so such a user would be unmanageable from the admin UI. Every creation path writes it today
  // (`POST /api/admin/users`, `scripts/create-user.mjs`); this pins that they must keep doing so.
  it("GET omits a user doc with no createdAt (orderBy excludes missing fields)", async () => {
    holder.db = new FakeFirestore({
      seed: {
        users: {
          admin1: { role: "admin", createdAt: "2024-01-01" },
          legacy: { username: "Old", usernameLower: "old", role: "user" },
        },
      },
    });
    const res = await listUsers(req("GET", { token: adminToken }));
    const ids = ((await res.json()) as Array<{ userId: string }>).map((u) => u.userId);
    expect(ids).toEqual(["admin1"]);
  });

  describe("DELETE", () => {
    // Delete is SOFT since Phase 3: the doc and the progress bundle survive so a restore returns
    // the child's work intact. This test previously asserted both were destroyed.
    it("marks the user deleted and RETAINS their progress doc", async () => {
      const db = new FakeFirestore({
        seed: {
          users: { admin1: { role: "admin" }, u2: { role: "user" } },
          user_progress: { u2: { bundleVersion: 4 } },
        },
      });
      holder.db = db;
      const res = await deleteUser(req("DELETE", { token: adminToken, body: { userId: "u2" } }));
      expect(res.status).toBe(200);
      expect(db.docs("users").find((d) => d.id === "u2")?.data).toMatchObject({ status: "deleted" });
      expect(db.docs("user_progress").find((d) => d.id === "u2")).toBeDefined();
    });

    it("revokes live sessions by bumping tokenVersion on delete", async () => {
      const db = new FakeFirestore({
        seed: { users: { admin1: { role: "admin" }, u2: { role: "user", tokenVersion: 3 } } },
      });
      holder.db = db;
      await deleteUser(req("DELETE", { token: adminToken, body: { userId: "u2" } }));
      expect(db.docs("users").find((d) => d.id === "u2")?.data.tokenVersion).toBe(4);
    });

    it("returns 404 for an unknown user", async () => {
      const db = new FakeFirestore({ seed: { users: { admin1: { role: "admin" } } } });
      holder.db = db;
      const res = await deleteUser(req("DELETE", { token: adminToken, body: { userId: "nope" } }));
      expect(res.status).toBe(404);
    });

    // The caller is provably an active admin and cannot act on themselves, so deleting anyone
    // else always leaves an active admin behind. An explicit last-admin guard was written and
    // then removed as unreachable; this pins the invariant that made it unnecessary.
    it("leaves the acting admin active when deleting the only other admin", async () => {
      const db = new FakeFirestore({
        seed: { users: { admin1: { role: "admin" }, other: { role: "admin" } } },
      });
      holder.db = db;
      expect(
        (await deleteUser(req("DELETE", { token: adminToken, body: { userId: "other" } }))).status,
      ).toBe(200);
      expect(db.docs("users").find((d) => d.id === "admin1")?.data.status).toBeUndefined();
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

  describe("lifecycle actions", () => {
    function lifecycleDb() {
      return new FakeFirestore({
        seed: { users: { admin1: { role: "admin" }, u2: { role: "user", usernameLower: "dana" } } },
      });
    }

    it("deactivate sets status and bumps tokenVersion", async () => {
      const db = lifecycleDb();
      holder.db = db;
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", action: "deactivate" } }),
      );
      expect(res.status).toBe(200);
      expect(db.docs("users").find((d) => d.id === "u2")?.data).toMatchObject({
        status: "deactivated",
        tokenVersion: 1,
      });
    });

    it("restore returns the account to active and bumps again", async () => {
      const db = new FakeFirestore({
        seed: {
          users: { admin1: { role: "admin" }, u2: { role: "user", status: "deleted", tokenVersion: 5 } },
        },
      });
      holder.db = db;
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", action: "restore" } }),
      );
      expect(res.status).toBe(200);
      // Bumping on restore too keeps any token minted before the deletion dead.
      expect(db.docs("users").find((d) => d.id === "u2")?.data).toMatchObject({
        status: "active",
        tokenVersion: 6,
      });
    });

    it("refuses to change your own status → 400", async () => {
      holder.db = lifecycleDb();
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: ADMIN.userId, action: "deactivate" } }),
      );
      expect(res.status).toBe(400);
    });

    it("refuses a password reset on a non-active account → 409", async () => {
      holder.db = new FakeFirestore({
        seed: { users: { admin1: { role: "admin" }, u2: { role: "user", status: "deleted" } } },
      });
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", password: "pw123456" } }),
      );
      expect(res.status).toBe(409);
    });

    it("records deactivate and restore audit rows", async () => {
      const db = lifecycleDb();
      holder.db = db;
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", action: "deactivate" } }));
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", action: "restore" } }));
      expect(db.docs("audit_log").map((d) => d.data.action)).toEqual([
        "user.deactivate",
        "user.restore",
      ]);
    });

    // Two admins deactivating each other at the same moment both pass their pre-flight checks.
    // The transaction re-reads the ACTOR so the loser sees the other's write; without that the
    // two transactions touch disjoint docs, neither conflicts, and both commit — leaving zero
    // active admins and no in-app way back.
    it("refuses the transition if the actor was deactivated mid-transaction → 409", async () => {
      // admin1 is ACTIVE at requireAdmin time — otherwise the request 403s before reaching the
      // transaction, which is a different (already-covered) path.
      let db: FakeFirestore;
      db = new FakeFirestore({
        seed: {
          users: { admin1: { role: "admin" }, u2: { role: "user" } },
        },
        // The competing admin's write lands between our read of the target and our commit.
        onTransactionRead: async (ref) => {
          if (ref.id === "u2") {
            await db.collection("users").doc("admin1").update({ status: "deactivated" });
          }
        },
      });
      holder.db = db;

      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", action: "deactivate" } }),
      );
      expect(res.status).toBe(409);
      expect(db.docs("users").find((d) => d.id === "u2")?.data.status).toBeUndefined();
    });

    it("rejects a userId containing a Firestore path separator → 400", async () => {
      // "a/b/c" is a valid document PATH, so an unconstrained id escapes the users collection
      // and also sidesteps the `userId === admin.userId` self-guard by string inequality.
      holder.db = lifecycleDb();
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2/sub/x", action: "deactivate" } }),
      );
      expect(res.status).toBe(400);
    });

    it("refuses to deactivate an already-deleted account → 409", async () => {
      holder.db = new FakeFirestore({
        seed: { users: { admin1: { role: "admin" }, u2: { role: "user", status: "deleted" } } },
      });
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "u2", action: "deactivate" } }),
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 when the target does not exist", async () => {
      holder.db = lifecycleDb();
      const res = await resetPassword(
        req("PATCH", { token: adminToken, body: { userId: "ghost", action: "deactivate" } }),
      );
      expect(res.status).toBe(404);
    });
  });

  describe("audit log (S9)", () => {
    it("records a user.create row with the actor and role", async () => {
      const db = seed();
      holder.db = db;
      await createUser(req("POST", { token: adminToken, body: { username: "Amit", password: "pw123456" } }));
      const rows = db.docs("audit_log");
      expect(rows).toHaveLength(1);
      const created = db.docs("users").find((d) => d.data.usernameLower === "amit")!;
      expect(rows[0].data).toMatchObject({
        actorId: ADMIN.userId,
        action: "user.create",
        targetId: created.id,
        meta: { role: "user" },
      });
      expect(typeof rows[0].data.at).toBe("string");
    });

    it("flags overridePolicy on create in meta", async () => {
      const db = seed();
      holder.db = db;
      await createUser(
        req("POST", { token: adminToken, body: { username: "Pin", password: "1234", overridePolicy: true } }),
      );
      expect(db.docs("audit_log")[0].data.meta).toMatchObject({ overridePolicy: true });
    });

    it("records a user.reset row (never the password)", async () => {
      const db = seed();
      holder.db = db;
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", password: "newpass123" } }));
      const rows = db.docs("audit_log");
      expect(rows).toHaveLength(1);
      expect(rows[0].data).toMatchObject({ actorId: ADMIN.userId, action: "user.reset", targetId: "u2" });
      expect(JSON.stringify(rows[0].data)).not.toContain("newpass123");
    });

    it("records a user.unlock row for the unlock action", async () => {
      const db = seed();
      holder.db = db;
      await resetPassword(req("PATCH", { token: adminToken, body: { userId: "u2", action: "unlock" } }));
      expect(db.docs("audit_log")[0].data).toMatchObject({ action: "user.unlock", targetId: "u2" });
    });

    it("records a user.delete row", async () => {
      const db = seed();
      holder.db = db;
      await deleteUser(req("DELETE", { token: adminToken, body: { userId: "u2" } }));
      expect(db.docs("audit_log")[0].data).toMatchObject({ actorId: ADMIN.userId, action: "user.delete", targetId: "u2" });
    });
  });
});
