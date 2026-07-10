import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST as unlockPost } from "@/app/api/grade-b-unlock/route";
import { POST as lockPost } from "@/app/api/grade-b-lock/route";
import { POST as legacyUnlockPost } from "@/app/api/unlock-grade-b/route";
import { POST as legacyLockPost } from "@/app/api/lock-grade-b/route";
import { MATH_B_LEGACY_COOKIE, subjectGradeBUnlockCookieName } from "@/lib/gradeUnlock";

type Handler = (req: NextRequest) => Promise<Response> | Response;

function makeReq(
  body?: unknown,
  opts: { proto?: "http" | "https"; forwarded?: string } = {},
): NextRequest {
  const proto = opts.proto ?? "https";
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.forwarded) headers["x-forwarded-proto"] = opts.forwarded;
  return new NextRequest(`${proto}://kids-math.test/api/x`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function cookieOf(res: Awaited<ReturnType<Handler>>, name: string) {
  return (res as Response & { cookies: { get: (n: string) => { value: string; maxAge?: number } | undefined } }).cookies.get(name);
}

describe("POST /api/grade-b-unlock", () => {
  it("sets the per-subject cookie to '1' with a long maxAge", async () => {
    const res = await unlockPost(makeReq({ subject: "english" }));
    const c = await cookieOf(res, subjectGradeBUnlockCookieName("english"));
    expect(c?.value).toBe("1");
    expect(c?.maxAge).toBeGreaterThan(60 * 60 * 24 * 300);
    // does NOT touch other subjects
    expect(await cookieOf(res, subjectGradeBUnlockCookieName("science"))).toBeUndefined();
  });

  it("for math also sets the legacy cookie in lock-step", async () => {
    const res = await unlockPost(makeReq({ subject: "math" }));
    expect((await cookieOf(res, subjectGradeBUnlockCookieName("math")))?.value).toBe("1");
    expect((await cookieOf(res, MATH_B_LEGACY_COOKIE))?.value).toBe("1");
  });

  it("rejects with 400 (no silent math default) when the body has no/invalid subject", async () => {
    const noBody = await unlockPost(makeReq());
    expect(noBody.status).toBe(400);
    expect(await cookieOf(noBody, subjectGradeBUnlockCookieName("math"))).toBeUndefined();

    const badSubject = await unlockPost(makeReq({ subject: "history" }));
    expect(badSubject.status).toBe(400);
  });

  it("marks the cookie secure only over https", async () => {
    const httpsRes = await unlockPost(makeReq({ subject: "science" }, { proto: "https" }));
    const httpRes = await unlockPost(makeReq({ subject: "science" }, { proto: "http" }));
    // NextResponse serializes `secure` into the Set-Cookie header.
    expect(httpsRes.headers.get("set-cookie")).toMatch(/secure/i);
    expect(httpRes.headers.get("set-cookie") ?? "").not.toMatch(/secure/i);
  });

  it("respects x-forwarded-proto: https behind a proxy on http", async () => {
    const res = await unlockPost(makeReq({ subject: "science" }, { proto: "http", forwarded: "https" }));
    expect(res.headers.get("set-cookie")).toMatch(/secure/i);
  });
});

describe("POST /api/grade-b-lock", () => {
  it("clears the per-subject cookie (maxAge 0)", async () => {
    const res = await lockPost(makeReq({ subject: "english" }));
    const c = await cookieOf(res, subjectGradeBUnlockCookieName("english"));
    expect(c?.value).toBe("");
    expect(c?.maxAge).toBe(0);
  });

  it("for math also clears the legacy cookie", async () => {
    const res = await lockPost(makeReq({ subject: "math" }));
    expect((await cookieOf(res, subjectGradeBUnlockCookieName("math")))?.maxAge).toBe(0);
    expect((await cookieOf(res, MATH_B_LEGACY_COOKIE))?.maxAge).toBe(0);
  });
});

describe("legacy math shims", () => {
  it("/api/unlock-grade-b sets the math cookies", async () => {
    const res = await legacyUnlockPost(makeReq());
    expect((await cookieOf(res, subjectGradeBUnlockCookieName("math")))?.value).toBe("1");
    expect((await cookieOf(res, MATH_B_LEGACY_COOKIE))?.value).toBe("1");
  });

  it("/api/lock-grade-b clears the math cookies", async () => {
    const res = await legacyLockPost(makeReq());
    expect((await cookieOf(res, MATH_B_LEGACY_COOKIE))?.maxAge).toBe(0);
  });
});
