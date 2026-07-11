import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getFirestore } from "@/lib/firestore/admin";
import { signToken, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/jwt.server";
import { getClientIp } from "@/lib/security/clientIp";
import { recordRateLimit } from "@/lib/security/rateLimit";
import { isBodyTooLarge, LOGIN_MAX_BODY_BYTES } from "@/lib/security/bodyLimit";

// A valid cost-12 bcrypt hash of a value no user can have. Compared against on the
// unknown-username path so login runs the same bcrypt work whether or not the account
// exists — closing the timing side-channel that let attackers enumerate usernames
// (roadmap S2). Cost must match BCRYPT_ROUNDS (12) used elsewhere so timing lines up.
const DUMMY_PASSWORD_HASH = "$2b$12$3oGqdeaKdLf9j5.LdEUe/uK/aevB9qgwFQ2z.YAeQFgKW7FIzuM/2";

// Login is IP + username keyed: a shared classroom IP shouldn't lock out the room, but
// repeated hits on one account are the brute-force signal. Generous window (shadow only).
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 };

export async function POST(request: NextRequest) {
  try {
    if (isBodyTooLarge(request, LOGIN_MAX_BODY_BYTES)) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

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

    const usernameLower = username.trim().toLowerCase();
    // Shadow-mode record only — never blocks in Phase 0 (roadmap S1).
    await recordRateLimit(`login:${getClientIp(request)}:${usernameLower}`, LOGIN_RATE_LIMIT);

    const db = getFirestore();
    const snapshot = await db
      .collection("users")
      .where("usernameLower", "==", usernameLower)
      .limit(1)
      .get();

    // Always run a bcrypt compare, even when the user is unknown (against the dummy
    // hash), so response timing does not reveal whether the account exists (S2).
    const userDoc = snapshot.empty ? null : snapshot.docs[0];
    const userData = userDoc?.data();
    const passwordHash = (userData?.passwordHash as string | undefined) ?? DUMMY_PASSWORD_HASH;
    const passwordMatch = await bcrypt.compare(password, passwordHash);

    if (!userDoc || !userData || !passwordMatch) {
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
