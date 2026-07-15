import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session.server";

export async function GET(request: NextRequest) {
  try {
    // Version-checked (R2-B): a revoked session logs out cleanly on the next app-load
    // instead of lingering in a broken "looks logged in but can't sync" half-state.
    const claims = await verifySession(request, { requireVersionCheck: true });
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Never leak the internal tokenVersion to the client — return the public AuthUser only.
    const { tokenVersion: _tokenVersion, ...user } = claims;
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
