import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { verifySession } from "@/lib/auth/session.server";
import { getFirestore } from "@/lib/firestore/admin";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/security/rateLimit";
import { adminCreateSchema, adminDeleteSchema, adminPatchSchema } from "@/lib/security/schemas";
import { validatePasswordStrength } from "@/lib/security/passwordPolicy";
import { checkLockout, clearLockout } from "@/lib/security/accountLockout";
import { writeAuditLog } from "@/lib/observability/auditLog";

const BCRYPT_ROUNDS = 12;

// Admin mutations are actor-keyed. Staged limiter: blocks only when RATE_LIMIT_ENFORCE=1.
const ADMIN_RATE_LIMIT = { limit: 30, windowMs: 60 * 1000 };

/**
 * Admin gate. Mutations pass `requireVersionCheck` so a revoked admin session (password reset
 * or "log out everywhere") is rejected immediately (roadmap S4). The read-only GET can stay
 * pure-JWT, but we version-check it too for a consistent admin surface — one cheap read.
 */
async function requireAdmin(request: NextRequest, requireVersionCheck = true) {
  const user = await verifySession(request, { requireVersionCheck });
  if (!user || user.role !== "admin") return null;
  return user;
}

/** 400 message shared by the create/reset password-policy rejections. */
function weakPasswordResponse(): NextResponse {
  return NextResponse.json(
    { error: "Password does not meet the minimum policy" },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = getFirestore();
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    // Enrich each row with its lockout state so the admin can see (and clear) a locked
    // account. One lockout read per user — fine at the current admin scale; when the list
    // grows past a few hundred it paginates (roadmap C4/Phase 4) and this rides that cursor.
    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const safe = Object.fromEntries(Object.entries(data).filter(([k]) => k !== "passwordHash"));
        const usernameLower = typeof data.usernameLower === "string" ? data.usernameLower : "";
        const isLocked = usernameLower ? (await checkLockout(usernameLower)).locked : false;
        return { userId: doc.id, ...safe, isLocked };
      }),
    );
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = await enforceRateLimit(`admin:${admin.userId}`, ADMIN_RATE_LIMIT);
    if (rl.blocked) return rateLimitedResponse(rl.retryAfterMs);

    const parsed = adminCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }
    const { username, password, role, overridePolicy } = parsed.data;

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    // Password policy (admin can override for simple/PIN passwords).
    if (!validatePasswordStrength(password, overridePolicy).ok) {
      return weakPasswordResponse();
    }

    const db = getFirestore();

    // Check for duplicate username
    const existing = await db
      .collection("users")
      .where("usernameLower", "==", trimmedUsername.toLowerCase())
      .limit(1)
      .get();
    if (!existing.empty) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userRole = role === "admin" ? "admin" : "user";
    const docRef = await db.collection("users").add({
      username: trimmedUsername,
      usernameLower: trimmedUsername.toLowerCase(),
      passwordHash,
      role: userRole,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    });

    // Audit trail (S9): who created whom, with the policy-override flag when used.
    await writeAuditLog({
      actorId: admin.userId,
      action: "user.create",
      targetId: docRef.id,
      meta: { role: userRole, ...(overridePolicy ? { overridePolicy: true } : {}) },
    });

    return NextResponse.json({ userId: docRef.id, username: trimmedUsername, role: userRole }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = await enforceRateLimit(`admin:${admin.userId}`, ADMIN_RATE_LIMIT);
    if (rl.blocked) return rateLimitedResponse(rl.retryAfterMs);

    const parsed = adminPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "userId and password required" }, { status: 400 });
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(parsed.data.userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const usernameLower = userDoc.data()?.usernameLower as string | undefined;

    // Unlock action: clear the account lockout so a stuck student can log in right now.
    // (`action` exists only on the unlock variant of the schema, so this also narrows the
    // discriminated union to the password-reset shape below.)
    if ("action" in parsed.data) {
      if (usernameLower) await clearLockout(usernameLower);
      await writeAuditLog({ actorId: admin.userId, action: "user.unlock", targetId: parsed.data.userId });
      return NextResponse.json({ ok: true, unlocked: true });
    }

    // Password reset.
    const { password, overridePolicy } = parsed.data;
    if (!password) {
      return NextResponse.json({ error: "userId and password required" }, { status: 400 });
    }
    if (!validatePasswordStrength(password, overridePolicy).ok) {
      return weakPasswordResponse();
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // Revoke every existing session for this user by bumping tokenVersion. Transactional so
    // concurrent resets can't lose an increment (roadmap S4). Also stamp the new hash.
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      // Guard the race where the user is deleted between the existence check above and here:
      // spreading `undefined` would resurrect a zombie doc with only these two fields.
      if (!snap.exists) throw new Error("user no longer exists");
      const data = snap.data() ?? {};
      const current = data.tokenVersion;
      const nextVersion = (typeof current === "number" ? current : 0) + 1;
      tx.set(userRef, { ...data, passwordHash, tokenVersion: nextVersion });
    });
    // Resetting the password also means "let them back in" — clear any active lockout.
    if (usernameLower) await clearLockout(usernameLower);

    // Audit trail (S9). Never store the new password — only that a reset happened.
    await writeAuditLog({
      actorId: admin.userId,
      action: "user.reset",
      targetId: parsed.data.userId,
      meta: overridePolicy ? { overridePolicy: true } : {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rl = await enforceRateLimit(`admin:${admin.userId}`, ADMIN_RATE_LIMIT);
    if (rl.blocked) return rateLimitedResponse(rl.retryAfterMs);

    const parsed = adminDeleteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { userId } = parsed.data;
    if (userId === admin.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const db = getFirestore();
    await db.collection("users").doc(userId).delete();
    await db.collection("user_progress").doc(userId).delete().catch(() => {/* no progress doc is fine */});

    await writeAuditLog({ actorId: admin.userId, action: "user.delete", targetId: userId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
