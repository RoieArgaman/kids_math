import { NextResponse, type NextRequest } from "next/server";

import { GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE } from "@/lib/gradeUnlock";

export async function POST(request: NextRequest) {
  // In production Next runs without necessarily being HTTPS (e.g. CI runs on http://).
  // Only mark the cookie as `secure` when the request is actually over https.
  const isSecure =
    request.nextUrl.protocol === "https" || request.headers.get("x-forwarded-proto") === "https";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: isSecure,
  });
  return res;
}

