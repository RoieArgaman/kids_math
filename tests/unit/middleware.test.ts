import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE } from "@/lib/gradeUnlock";

// Test-only exercise of the grade-B unlock gate. Does NOT modify middleware behaviour —
// it just pins the current redirect/passthrough contract so a regression in the gate
// (the thing that keeps grade B locked until earned) fails fast in the unit suite.
function makeRequest(path: string, opts: { unlocked?: boolean } = {}): NextRequest {
  const req = new NextRequest(`https://kids-math.test${path}`);
  if (opts.unlocked) {
    req.cookies.set(GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE);
  }
  return req;
}

function isPassthrough(res: ReturnType<typeof middleware>): boolean {
  // NextResponse.next() marks the response with this header.
  return res.headers.get("x-middleware-next") === "1";
}

describe("middleware grade-B unlock gate", () => {
  it("redirects a locked grade-B page to the locked screen with a next param", () => {
    const res = middleware(makeRequest("/grade/b/day/day-1"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/grade/b/locked");
    expect(location).toContain("next=");
  });

  it("lets grade B through once the unlock cookie is present", () => {
    const res = middleware(makeRequest("/grade/b/day/day-1", { unlocked: true }));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get("location")).toBeNull();
  });

  it("never redirects the locked screen itself (avoids a redirect loop)", () => {
    const res = middleware(makeRequest("/grade/b/locked"));
    expect(isPassthrough(res)).toBe(true);
  });

  it("does not gate grade A", () => {
    const res = middleware(makeRequest("/grade/a/day/day-1"));
    expect(isPassthrough(res)).toBe(true);
  });
});
