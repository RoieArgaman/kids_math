// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { FakeFirestore } from "./fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { POST as logoutAll } from "@/app/api/auth/logout-all/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

const USER: AuthUser = { userId: "u1", username: "Dana", role: "user" };

function req(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  return new NextRequest("https://kids-math.test/api/auth/logout-all", { method: "POST", headers });
}

function cookie(res: Awaited<ReturnType<typeof logoutAll>>, name: string) {
  return (res as unknown as {
    cookies: { get: (n: string) => { value: string; maxAge?: number } | undefined };
  }).cookies.get(name);
}

describe("POST /api/auth/logout-all", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
  });

  beforeEach(() => {
    holder.db = new FakeFirestore({ seed: { users: { u1: { username: "Dana", role: "user" } } } });
  });

  it("returns 401 with no session", async () => {
    expect((await logoutAll(req())).status).toBe(401);
  });

  it("bumps the caller's tokenVersion (revoking all sessions) and clears the session cookie", async () => {
    const db = holder.db as FakeFirestore;
    const res = await logoutAll(req(await signToken(USER, 0)));
    expect(res.status).toBe(200);
    expect(db.docs("users").find((d) => d.id === "u1")!.data.tokenVersion).toBe(1);
    const session = cookie(res, SESSION_COOKIE_NAME);
    expect(session?.value).toBe("");
    expect(session?.maxAge).toBe(0);
  });

  it("increments from an existing version", async () => {
    holder.db = new FakeFirestore({
      seed: { users: { u1: { username: "Dana", role: "user", tokenVersion: 4 } } },
    });
    const db = holder.db as FakeFirestore;
    await logoutAll(req(await signToken(USER, 4)));
    expect(db.docs("users").find((d) => d.id === "u1")!.data.tokenVersion).toBe(5);
  });
});
