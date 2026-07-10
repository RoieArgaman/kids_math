import { type NextRequest } from "next/server";

import { clearSubjectGradeBUnlock } from "@/lib/server/gradeUnlockCookies";

/** Subject-aware grade-B lock (revoke). Body: `{ subject: "math" | "english" | "science" }`. */
export async function POST(request: NextRequest) {
  return clearSubjectGradeBUnlock(request);
}
