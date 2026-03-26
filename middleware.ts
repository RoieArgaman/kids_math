import { NextResponse, type NextRequest } from "next/server";
import { GRADE_B_UNLOCK_COOKIE_NAME, GRADE_B_UNLOCK_COOKIE_VALUE } from "@/lib/gradeUnlock";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/grade/b")) {
    const unlocked = request.cookies.get(GRADE_B_UNLOCK_COOKIE_NAME)?.value === GRADE_B_UNLOCK_COOKIE_VALUE;
    const isLockedPage = pathname.startsWith("/grade/b/locked");
    const isApi = pathname.startsWith("/api/");

    if (!unlocked && !isLockedPage && !isApi) {
      const url = request.nextUrl.clone();
      url.pathname = "/grade/b/locked";
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/grade/b/:path*"],
};

