// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { FakeFirestore } from "../../app/api/fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { signToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { verifySession } from "@/lib/auth/session.server";
import type { AuthUser } from "@/lib/auth/types";

const USER: AuthUser = { userId: "u1", username: "Dana", role: "user" };

async function reqWithToken(tokenVersion?: number): Promise<NextRequest> {
  const r = new NextRequest("https://kids-math.test/api/user/progress", { method: "GET" });
  if (tokenVersion !== undefined) {
    r.cookies.set(SESSION_COOKIE_NAME, await signToken(USER, tokenVersion));
  }
  return r;
}

function seed(userDoc: Record<string, unknown>): FakeFirestore {
  return new FakeFirestore({ seed: { users: { u1: userDoc } } });
}

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
});

beforeEach(() => {
  holder.db = seed({ username: "Dana", role: "user" }); // no tokenVersion field ⇒ 0
});

describe("verifySession (S4 revocation)", () => {
  it("returns null when there is no cookie", async () => {
    expect(await verifySession(new NextRequest("https://kids-math.test/x"))).toBeNull();
  });

  it("skips the DB when requireVersionCheck is false (pure JWT)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("should not be read") });
    const claims = await verifySession(await reqWithToken(0), { requireVersionCheck: false });
    expect(claims).toEqual({ ...USER, tokenVersion: 0 });
  });

  it("token v0 + user doc with NO version field ⇒ valid (backward-compat)", async () => {
    const claims = await verifySession(await reqWithToken(0), { requireVersionCheck: true });
    expect(claims).toEqual({ ...USER, tokenVersion: 0 });
  });

  it("token v0 + user doc v0 ⇒ valid", async () => {
    holder.db = seed({ username: "Dana", role: "user", tokenVersion: 0 });
    expect(await verifySession(await reqWithToken(0), { requireVersionCheck: true })).not.toBeNull();
  });

  it("token v0 + user doc v1 ⇒ REVOKED (null)", async () => {
    holder.db = seed({ username: "Dana", role: "user", tokenVersion: 1 });
    expect(await verifySession(await reqWithToken(0), { requireVersionCheck: true })).toBeNull();
  });

  it("token v1 + user doc v1 ⇒ valid again after a bump", async () => {
    holder.db = seed({ username: "Dana", role: "user", tokenVersion: 1 });
    expect(await verifySession(await reqWithToken(1), { requireVersionCheck: true })).not.toBeNull();
  });

  it("deleted account (no doc) ⇒ null", async () => {
    holder.db = new FakeFirestore({ seed: { users: {} } });
    expect(await verifySession(await reqWithToken(0), { requireVersionCheck: true })).toBeNull();
  });

  it("propagates a Firestore error (caller yields 500, not a spurious logout)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("firestore down") });
    await expect(verifySession(await reqWithToken(0), { requireVersionCheck: true })).rejects.toThrow();
  });
});
