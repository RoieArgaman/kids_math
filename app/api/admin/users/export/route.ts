import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth/session.server";
import { getFirestore } from "@/lib/firestore/admin";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security/rateLimit";
import { writeAuditLog } from "@/lib/observability/auditLog";
import { buildUserExport, exportFileName, type RawDoc } from "@/lib/compliance/export";

/**
 * GET /api/admin/users/export?userId=... — guardian data export (roadmap Phase 3.2).
 *
 * ADMIN-OPERATED, NOT self-service: a guardian asks, an admin fulfils. Same gate/limiter/audit
 * shape as the sibling admin mutations in ../route.ts.
 *
 * A SOFT-DELETED user exports normally — they are exactly who a guardian asks about, and the
 * doc plus progress bundle are retained precisely so the record can still be produced.
 */

// Actor-keyed, mirroring the sibling admin route. Staged limiter: blocks only when
// RATE_LIMIT_ENFORCE=1.
const ADMIN_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 };

// Inline (not in lib/security/schemas.ts) because this is the only query-param admin input.
const exportQuerySchema = z.object({ userId: z.string().trim().min(1).max(200) });

async function requireAdmin(request: NextRequest) {
  const user = await verifySession(request, { requireVersionCheck: true });
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Enforced unconditionally, unlike the staged limiter elsewhere: a stolen admin session
    // could otherwise pull every child's full record with no ceiling.
    const rl = await checkRateLimit(`admin:${admin.userId}`, ADMIN_RATE_LIMIT);
    if (!rl.allowed) return rateLimitedResponse(rl.retryAfterMs);

    const parsed = exportQuerySchema.safeParse({
      userId: request.nextUrl.searchParams.get("userId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const { userId } = parsed.data;

    const db = getFirestore();
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const progressSnap = await db.collection("user_progress").doc(userId).get();

    const userDoc: RawDoc = { id: userId, data: userSnap.data() };
    const progressDoc: RawDoc | null = progressSnap.exists
      ? { id: userId, data: progressSnap.data() }
      : null;
    const payload = buildUserExport(userDoc, progressDoc);

    // Audit BEFORE responding: a fulfilled export is a data egress and must always be traceable.
    await writeAuditLog({ actorId: admin.userId, action: "user.export", targetId: userId });

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${exportFileName(userId, new Date())}"`,
        // A child's full record must never sit in a shared/browser cache.
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
