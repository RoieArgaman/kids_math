import { type NextRequest } from "next/server";

/**
 * Client-IP extraction for rate-limiter keying (roadmap S11 / Phase 0.0).
 *
 * On Firebase App Hosting the request reaches the app through Google's front end
 * (Cloud Run under the hood). That trusted proxy *appends* the IP it observed to
 * the right of any `X-Forwarded-For` the client may have sent, so the chain looks
 * like:
 *
 *     X-Forwarded-For: <client-spoofed?>, …, <ip-the-proxy-observed>
 *
 * A malicious client can only *prepend* values; it cannot control what the trusted
 * proxy appends. So the trustworthy entry is counted from the RIGHT, not the left.
 * `TRUSTED_PROXY_HOPS` = how many proxy-appended hops sit to the right of the real
 * client IP.
 *
 * VERIFIED (2026-07-15, roadmap 2.7 / Appendix A): a live request to App Hosting
 * showed `X-Forwarded-For: <client>, <google-internal>, <google-front-end>` — e.g.
 * `85.64.144.21, 35.219.200.210, 192.178.13.101`. Google appends **two** hops, so the
 * real client is the entry **2 from the right**, NOT the right-most (which is a shared
 * Google Front End IP). `TRUSTED_PROXY_HOPS = 2`. Counting from the right stays
 * spoof-proof: a client can only prepend fakes on the left, and the two right-most
 * entries are always Google-appended. Re-verify with the `/api/diag/ip` probe if the
 * platform's proxy topology ever changes.
 */
const TRUSTED_PROXY_HOPS = 2;

/** Stable sentinel when no forwarded IP is present (e.g. local dev, direct calls). */
export const UNKNOWN_CLIENT_IP = "unknown";

/**
 * Return the trusted client IP for `request`, ignoring any client-prepended spoof.
 * Never throws; returns {@link UNKNOWN_CLIENT_IP} when no usable IP is found.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length > 0) {
      // Count from the right: the proxy-appended, non-spoofable position.
      const idx = parts.length - 1 - TRUSTED_PROXY_HOPS;
      const ip = parts[idx] ?? parts[0];
      if (ip) return ip;
    }
  }
  // `x-real-ip` is a common single-value fallback some proxies also set.
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return UNKNOWN_CLIENT_IP;
}
