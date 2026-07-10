import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { clearAllGradeBUnlockCookies } from "@/lib/server/gradeUnlockCookies";

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  // Reset Grade-B access so the next student on this device can't inherit the
  // prior student's unlock. The client reconcile re-grants it for the legit user
  // from their own hydrated grade-A completion.
  clearAllGradeBUnlockCookies(res, request);
  return res;
}
