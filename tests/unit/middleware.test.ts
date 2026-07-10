import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import {
  GRADE_B_UNLOCK_COOKIE_NAME,
  GRADE_B_UNLOCK_COOKIE_VALUE,
  subjectGradeBUnlockCookieName,
} from "@/lib/gradeUnlock";
import type { Subject } from "@/lib/subjects";

// Test-only exercise of the grade-B unlock gate. Does NOT modify middleware behaviour —
// it just pins the current redirect/passthrough contract so a regression in the gate
// (the thing that keeps grade B locked until earned) fails fast in the unit suite.
function makeRequest(
  path: string,
  opts: { unlocked?: boolean; unlockSubjects?: Subject[] } = {},
): NextRequest {
  const req = new NextRequest(`https://kids-math.test${path}`);
  if (opts.unlocked) {
    // Legacy single cookie (returning math-B user).
    req.cookies.set(GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE);
  }
  for (const subject of opts.unlockSubjects ?? []) {
    req.cookies.set(subjectGradeBUnlockCookieName(subject), GRADE_B_UNLOCK_COOKIE_VALUE);
  }
  return req;
}

function isPassthrough(res: ReturnType<typeof middleware>): boolean {
  // NextResponse.next() marks the response with this header.
  return res.headers.get("x-middleware-next") === "1";
}

function locationOf(res: ReturnType<typeof middleware>): string {
  return res.headers.get("location") ?? "";
}

describe("middleware grade-B unlock gate (math)", () => {
  it("redirects a locked grade-B page to the locked screen with a next param", () => {
    const res = middleware(makeRequest("/grade/b/day/day-1"));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/grade/b/locked");
    expect(locationOf(res)).toContain("next=");
  });

  it("lets grade B through with the legacy cookie", () => {
    const res = middleware(makeRequest("/grade/b/day/day-1", { unlocked: true }));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets grade B through with the new per-subject math cookie", () => {
    const res = middleware(makeRequest("/grade/b/day/day-1", { unlockSubjects: ["math"] }));
    expect(isPassthrough(res)).toBe(true);
  });

  it("never redirects the locked screen itself (avoids a redirect loop)", () => {
    expect(isPassthrough(middleware(makeRequest("/grade/b/locked")))).toBe(true);
  });

  it("does not gate grade A", () => {
    expect(isPassthrough(middleware(makeRequest("/grade/a/day/day-1")))).toBe(true);
  });
});

describe("middleware per-subject grade-B gates (english / science)", () => {
  it("redirects /english/b without the english cookie", () => {
    const res = middleware(makeRequest("/english/b/day/day-1"));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/english/b/locked");
  });

  it("english cookie does NOT open the science subtree (per-subject isolation)", () => {
    const res = middleware(makeRequest("/science/b", { unlockSubjects: ["english"] }));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/science/b/locked");
  });

  it("opens /science/b once the science cookie is present", () => {
    const res = middleware(makeRequest("/science/b/day/day-1", { unlockSubjects: ["science"] }));
    expect(isPassthrough(res)).toBe(true);
  });

  it("legacy math cookie does NOT open english (only math accepts it)", () => {
    const res = middleware(makeRequest("/english/b", { unlocked: true }));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/english/b/locked");
  });
});

describe("middleware grade-level gate (/subjects/b)", () => {
  it("redirects /subjects/b when NO subject is unlocked", () => {
    const res = middleware(makeRequest("/subjects/b"));
    expect(res.status).toBe(307);
    expect(locationOf(res)).toContain("/subjects/b/locked");
  });

  it("opens /subjects/b when ANY subject is unlocked", () => {
    const res = middleware(makeRequest("/subjects/b", { unlockSubjects: ["english"] }));
    expect(isPassthrough(res)).toBe(true);
  });

  it("does not gate /subjects/a", () => {
    // /subjects/a is not in the matcher; if reached, it passes through.
    expect(isPassthrough(middleware(makeRequest("/subjects/a")))).toBe(true);
  });
});
