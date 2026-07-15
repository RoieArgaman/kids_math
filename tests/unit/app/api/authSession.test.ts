// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { FakeFirestore } from "./fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { GET as me } from "@/app/api/auth/me/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

function reqWithCookie(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  return new NextRequest("https://kids-math.test/api/auth/me", { headers });
}

const USER: AuthUser = { userId: "u9", username: "Noa", role: "admin" };

function seed(userDoc: Record<string, unknown> = { username: "Noa", role: "admin" }): FakeFirestore {
  return new FakeFirestore({ seed: { users: { u9: userDoc } } });
}

describe("GET /api/auth/me", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
  });

  beforeEach(() => {
    holder.db = seed(); // no tokenVersion field ⇒ 0
  });

  it("returns the public user (no tokenVersion) for a valid session token", async () => {
    const res = await me(reqWithCookie(await signToken(USER)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(USER); // exactly AuthUser — tokenVersion stripped
  });

  it("still accepts a legacy token (version 0) against a user doc with no version field", async () => {
    holder.db = seed({ username: "Noa", role: "admin" });
    const res = await me(reqWithCookie(await signToken(USER, 0)));
    expect(res.status).toBe(200);
  });

  it("returns 401 for a REVOKED token (stored version bumped past the token)", async () => {
    holder.db = seed({ username: "Noa", role: "admin", tokenVersion: 1 });
    const res = await me(reqWithCookie(await signToken(USER, 0)));
    expect(res.status).toBe(401);
  });

  it("returns 401 when no session cookie is present (no DB read)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("should not be read") });
    expect((await me(reqWithCookie(undefined))).status).toBe(401);
  });

  it("returns 401 for a tampered/garbage token", async () => {
    expect((await me(reqWithCookie("not-a-real-jwt"))).status).toBe(401);
  });

  it("returns 401 for a token signed with a different secret", async () => {
    const token = await signToken(USER);
    process.env.JWT_SECRET = "a-completely-different-secret-32-chars-xx";
    expect((await me(reqWithCookie(token))).status).toBe(401);
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
  });
});
