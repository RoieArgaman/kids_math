import { type NextRequest } from "next/server";

import { setSubjectGradeBUnlock } from "@/lib/server/gradeUnlockCookies";

/** Subject-aware grade-B unlock. Body: `{ subject: "math" | "english" | "science" }`. */
export async function POST(request: NextRequest) {
  return setSubjectGradeBUnlock(request);
}
