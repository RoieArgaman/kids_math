import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { MATH_B_LEGACY_COOKIE, subjectGradeBUnlockCookieName } from "@/lib/gradeUnlock";
import { SUBJECTS } from "@/lib/subjects";

function makeReq(): NextRequest {
  return new NextRequest("https://kids-math.test/api/auth/logout", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
}

async function cookieOf(res: Response, name: string) {
  return (
    res as Response & {
      cookies: { get: (n: string) => { value: string; maxAge?: number } | undefined };
    }
  ).cookies.get(name);
}

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await logoutPost(makeReq());
    const c = await cookieOf(res, SESSION_COOKIE_NAME);
    expect(c?.value).toBe("");
    expect(c?.maxAge).toBe(0);
  });

  it("resets EVERY subject's Grade-B unlock cookie so the next student can't inherit access", async () => {
    const res = await logoutPost(makeReq());
    for (const subject of SUBJECTS) {
      const c = await cookieOf(res, subjectGradeBUnlockCookieName(subject));
      expect(c?.value).toBe("");
      expect(c?.maxAge).toBe(0);
    }
    // legacy math cookie too
    expect((await cookieOf(res, MATH_B_LEGACY_COOKIE))?.maxAge).toBe(0);
  });
});
