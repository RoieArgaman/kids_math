import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/security/clientIp";

/**
 * TEMPORARY diagnostic (roadmap 2.7 — TRUSTED_PROXY_HOPS verification, Appendix A).
 *
 * Returns what the app observes for the caller's IP so we can confirm empirically how many
 * proxy hops Firebase App Hosting appends to `X-Forwarded-For`, and whether the right-most
 * entry (TRUSTED_PROXY_HOPS = 0) is really the client. Compare `clientIp` below against your
 * own known public IP (e.g. from whatismyip.com).
 *
 * PRIVACY: logs NOTHING — it only echoes the caller their own request metadata in the
 * response body. DELETE THIS ROUTE once the verification is recorded.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const xff = request.headers.get("x-forwarded-for");
  return NextResponse.json({
    xForwardedFor: xff,
    // Split so we can see the chain + count hops. The trusted (proxy-appended) client IP is
    // the RIGHT-most entry when TRUSTED_PROXY_HOPS = 0.
    xForwardedForParts: xff ? xff.split(",").map((p) => p.trim()) : [],
    xRealIp: request.headers.get("x-real-ip"),
    clientIp: getClientIp(request),
    note: "TEMPORARY proxy-hop diagnostic — delete after verification (roadmap 2.7).",
  });
}
