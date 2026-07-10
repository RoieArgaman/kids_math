// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET as me } from "@/app/api/auth/me/route";
import { SESSION_COOKIE_NAME, signToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

function reqWithCookie(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token !== undefined) headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
  return new NextRequest("https://kids-math.test/api/auth/me", { headers });
}

const USER: AuthUser = { userId: "u9", username: "Noa", role: "admin" };

describe("GET /api/auth/me", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
  });

  it("returns the user for a valid session token", async () => {
    const token = await signToken(USER);
    const res = await me(reqWithCookie(token));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(USER);
  });

  it("returns 401 when no session cookie is present", async () => {
    const res = await me(reqWithCookie(undefined));
    expect(res.status).toBe(401);
  });

  it("returns 401 for a tampered/garbage token", async () => {
    const res = await me(reqWithCookie("not-a-real-jwt"));
    expect(res.status).toBe(401);
  });

  it("returns 401 for a token signed with a different secret", async () => {
    const token = await signToken(USER);
    process.env.JWT_SECRET = "a-completely-different-secret-32-chars-xx";
    const res = await me(reqWithCookie(token));
    expect(res.status).toBe(401);
    process.env.JWT_SECRET = "test-secret-value-at-least-32-chars-long!!";
  });
});
