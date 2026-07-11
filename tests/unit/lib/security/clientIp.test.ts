// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { getClientIp, UNKNOWN_CLIENT_IP } from "@/lib/security/clientIp";

function reqWith(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://kids-math.test/api/x", { headers });
}

describe("getClientIp", () => {
  it("returns the right-most (proxy-appended) IP, ignoring a client-prepended spoof", () => {
    // A client can only prepend to X-Forwarded-For; the trusted proxy appends on the right.
    const r = reqWith({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" });
    expect(getClientIp(r)).toBe("203.0.113.7");
  });

  it("handles a single-value XFF", () => {
    expect(getClientIp(reqWith({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("ignores empty/whitespace entries", () => {
    expect(getClientIp(reqWith({ "x-forwarded-for": " , 203.0.113.7 ," }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip when XFF is absent", () => {
    expect(getClientIp(reqWith({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
  });

  it("returns the sentinel when no forwarded IP is present", () => {
    expect(getClientIp(reqWith({}))).toBe(UNKNOWN_CLIENT_IP);
  });
});
