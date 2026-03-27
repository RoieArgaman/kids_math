import { NextResponse, type NextRequest } from "next/server";

import { GRADE_B_UNLOCK_COOKIE_NAME } from "@/lib/gradeUnlock";

export async function POST(request: NextRequest) {
  const isSecure =
    request.nextUrl.protocol === "https" || request.headers.get("x-forwarded-proto") === "https";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GRADE_B_UNLOCK_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: isSecure,
  });
  return res;
}
