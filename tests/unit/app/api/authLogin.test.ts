// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

import { FakeFirestore } from "./fakeFirestore";

// getFirestore is swapped for an in-memory fake we can reseed per test.
const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { POST as login } from "@/app/api/auth/login/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { verifyToken } from "@/lib/auth/jwt.server";

const PASSWORD = "correct-horse";
let passwordHash: string;

function req(
  body?: unknown,
  opts: { proto?: "http" | "https"; forwarded?: string; contentLength?: number } = {},
): NextRequest {
  const proto = opts.proto ?? "https";
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.forwarded) headers["x-forwarded-proto"] = opts.forwarded;
  if (opts.contentLength !== undefined) headers["content-length"] = String(opts.contentLength);
  return new NextRequest(`${proto}://kids-math.test/api/auth/login`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function seedWithUser(): FakeFirestore {
  return new FakeFirestore({
    seed: {
      users: {
        u1: {
          username: "Dana",
          usernameLower: "dana",
          passwordHash,
          role: "user",
        },
      },
    },
  });
}

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
    passwordHash = await bcrypt.hash(PASSWORD, 4); // cheap cost for tests
  });

  beforeEach(() => {
    holder.db = seedWithUser();
  });

  it("returns 200 with the user and a signed httpOnly session cookie on valid creds", async () => {
    const res = await login(req({ username: "dana", password: PASSWORD }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { user: { userId: string; username: string; role: string } };
    expect(json.user).toEqual({ userId: "u1", username: "Dana", role: "user" });

    const cookie = (res as unknown as { cookies: { get: (n: string) => { value: string; httpOnly?: boolean; sameSite?: string; secure?: boolean } | undefined } }).cookies.get(SESSION_COOKIE_NAME);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    // The cookie carries a real, verifiable JWT for this user.
    const verified = await verifyToken(cookie!.value);
    expect(verified).toEqual({ userId: "u1", username: "Dana", role: "user" });
  });

  it("is case-insensitive on username (queries usernameLower)", async () => {
    const res = await login(req({ username: "  DANA  ", password: PASSWORD }));
    expect(res.status).toBe(200);
  });

  it("sets secure cookie over https and via x-forwarded-proto, but not plain http", async () => {
    const secureDirect = await login(req({ username: "dana", password: PASSWORD }, { proto: "https" }));
    holder.db = seedWithUser();
    const secureFwd = await login(
      req({ username: "dana", password: PASSWORD }, { proto: "http", forwarded: "https" }),
    );
    holder.db = seedWithUser();
    const insecure = await login(req({ username: "dana", password: PASSWORD }, { proto: "http" }));

    const get = (r: Awaited<ReturnType<typeof login>>) =>
      (r as unknown as { cookies: { get: (n: string) => { secure?: boolean } | undefined } }).cookies.get(SESSION_COOKIE_NAME);
    expect(get(secureDirect)?.secure).toBe(true);
    expect(get(secureFwd)?.secure).toBe(true);
    expect(get(insecure)?.secure).toBe(false);
  });

  it("rejects a malformed body with 400 and no cookie", async () => {
    const res = await login(req({ username: 123 }));
    expect(res.status).toBe(400);
    const cookie = (res as unknown as { cookies: { get: (n: string) => unknown } }).cookies.get(SESSION_COOKIE_NAME);
    expect(cookie).toBeUndefined();
  });

  it("rejects a missing JSON body with 400", async () => {
    const res = await login(req(undefined));
    // No body → request.json() throws → caught → 400 (invalid) or 500; assert not authenticated.
    expect([400, 500]).toContain(res.status);
  });

  it("returns 401 for empty username/password", async () => {
    expect((await login(req({ username: "   ", password: PASSWORD }))).status).toBe(401);
    holder.db = seedWithUser();
    expect((await login(req({ username: "dana", password: "" }))).status).toBe(401);
  });

  it("returns 401 for an unknown user", async () => {
    const res = await login(req({ username: "ghost", password: PASSWORD }));
    expect(res.status).toBe(401);
  });

  it("returns 401 for a wrong password", async () => {
    const res = await login(req({ username: "dana", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 500 when Firestore is unavailable", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("firestore down") });
    const res = await login(req({ username: "dana", password: PASSWORD }));
    expect(res.status).toBe(500);
  });

  // Roadmap S2: login must run bcrypt work even for an unknown user, so response
  // timing does not reveal whether an account exists. We assert the compare RUNS on
  // the unknown-user path (timing assertions are too flaky to be meaningful here).
  it("runs a bcrypt compare even for an unknown user (constant-time / S2)", async () => {
    const spy = vi.spyOn(bcrypt, "compare");
    const res = await login(req({ username: "ghost", password: PASSWORD }));
    expect(res.status).toBe(401);
    expect(spy).toHaveBeenCalledTimes(1); // dummy-hash compare on the unknown path
    spy.mockRestore();
  });

  // Roadmap S5: reject oversized bodies before parsing.
  it("returns 413 for an over-cap login body", async () => {
    const res = await login(req({ username: "dana", password: PASSWORD }, { contentLength: 5000 }));
    expect(res.status).toBe(413);
  });

  it("does not 413 a normal-sized body", async () => {
    const res = await login(req({ username: "dana", password: PASSWORD }, { contentLength: 100 }));
    expect(res.status).toBe(200);
  });
});
