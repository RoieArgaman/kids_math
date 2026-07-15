// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { getClientIp, UNKNOWN_CLIENT_IP } from "@/lib/security/clientIp";

function reqWith(headers: Record<string, string>): NextRequest {
  return new NextRequest("https://kids-math.test/api/x", { headers });
}

describe("getClientIp (TRUSTED_PROXY_HOPS = 2, verified against App Hosting)", () => {
  it("returns the real client — 2 entries from the right — for the App Hosting chain", () => {
    // Live-verified shape: <client>, <google-internal>, <google-front-end>.
    // The right-most entry is a SHARED Google Front End IP, not the client.
    const r = reqWith({ "x-forwarded-for": "85.64.144.21, 35.219.200.210, 192.178.13.101" });
    expect(getClientIp(r)).toBe("85.64.144.21");
  });

  it("ignores a client-prepended spoof (only the two right-most hops are trusted)", () => {
    // A malicious client prepends a fake; Google still appends its two hops on the right,
    // so counting 2 from the right lands on the real client, never the spoof.
    const r = reqWith({
      "x-forwarded-for": "1.2.3.4, 85.64.144.21, 35.219.200.210, 192.178.13.101",
    });
    expect(getClientIp(r)).toBe("85.64.144.21");
  });

  it("falls back to the left-most entry when the chain is shorter than expected", () => {
    // Direct/local calls without the full proxy chain — best-effort left-most.
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
