import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session.server";

// Identity is per-request and must never be cached: a 401 (or a 200 for the wrong cookie)
// replayed from a shared/browser cache on a Back-button full reload would misrepresent the
// session and, on the client, trigger a spurious logout. Applied to every response below.
const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: NextRequest) {
  try {
    // Version-checked (R2-B): a revoked session logs out cleanly on the next app-load
    // instead of lingering in a broken "looks logged in but can't sync" half-state.
    const claims = await verifySession(request, { requireVersionCheck: true });
    if (!claims) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
    }

    // Never leak the internal tokenVersion to the client — return the public AuthUser only.
    return NextResponse.json(
      {
        userId: claims.userId,
        username: claims.username,
        role: claims.role,
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: NO_STORE });
  }
}
