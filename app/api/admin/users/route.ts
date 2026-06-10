import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { getFirestore } from "@/lib/firestore/admin";

const BCRYPT_ROUNDS = 12;

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const db = getFirestore();
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc) => {
      const safe = Object.fromEntries(
      Object.entries(doc.data()).filter(([k]) => k !== "passwordHash"),
    );
      return { userId: doc.id, ...safe };
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).username !== "string" ||
      typeof (body as Record<string, unknown>).password !== "string"
    ) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const { username, password, role } = body as {
      username: string;
      password: string;
      role?: string;
    };

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
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
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ userId: docRef.id, username: trimmedUsername, role: userRole }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = (await request.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).userId !== "string"
    ) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { userId } = body as { userId: string };
    if (userId === admin.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const db = getFirestore();
    await db.collection("users").doc(userId).delete();
    await db.collection("user_progress").doc(userId).delete().catch(() => {/* no progress doc is fine */});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
