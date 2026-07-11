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
 * client IP. With a single trusted front end the client IP is the right-most entry
 * (0 hops). If App Hosting turns out to append an extra internal hop, bump this.
 *
 * IMPORTANT: this is a *best-effort, verify-before-enforce* contract. The limiter it
 * feeds runs in shadow mode only (records, never blocks) in Phase 0, so an off-by-one
 * here cannot lock anyone out. Before the limiter is promoted to enforcing (roadmap
 * Phase 2.7) this offset MUST be confirmed empirically against App Hosting. See
 * Appendix A of the Production Hardening Roadmap.
 */
const TRUSTED_PROXY_HOPS = 0;

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
