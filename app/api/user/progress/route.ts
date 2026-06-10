import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { getFirestore } from "@/lib/firestore/admin";
import type { UserProgressBundle } from "@/lib/user-data/types";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getFirestore();
    const doc = await db.collection("user_progress").doc(user.userId).get();
    if (!doc.exists) return NextResponse.json(null);
    return NextResponse.json(doc.data());
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      (body as Record<string, unknown>).bundleVersion !== 1
    ) {
      return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
    }

    const bundle = body as UserProgressBundle;
    const db = getFirestore();
    await db
      .collection("user_progress")
      .doc(user.userId)
      .set({ ...bundle, updatedAt: new Date().toISOString() });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
