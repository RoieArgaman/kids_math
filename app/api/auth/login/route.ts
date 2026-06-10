import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getFirestore } from "@/lib/firestore/admin";
import { signToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/jwt.server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).username !== "string" ||
      typeof (body as Record<string, unknown>).password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { username, password } = body as { username: string; password: string };
    if (!username.trim() || !password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection("users")
      .where("usernameLower", "==", username.trim().toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash as string);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = {
      userId: userDoc.id,
      username: userData.username as string,
      role: (userData.role as "user" | "admin") ?? "user",
    };

    const token = await signToken(user);
    const isSecure =
      request.nextUrl.protocol === "https:" ||
      request.headers.get("x-forwarded-proto") === "https";

    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
      secure: isSecure,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
