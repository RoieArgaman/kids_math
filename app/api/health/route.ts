import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firestore/admin";

// Readiness probe for uptime monitors. Must run live on every hit, never cached.
export const dynamic = "force-dynamic";

// Reject if the wrapped promise doesn't settle within `ms`. Used to bound the
// Firestore connectivity check so a hung backend surfaces as "degraded" fast.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const FIRESTORE_PING_TIMEOUT_MS = 1500;

export async function GET(): Promise<NextResponse> {
  try {
    // Cheap O(1) connectivity probe: a `.get()` on a (possibly missing) doc still
    // proves we can reach Firestore. Bounded so a stalled backend can't hang the probe.
    await withTimeout(
      getFirestore().collection("_health").doc("ping").get(),
      FIRESTORE_PING_TIMEOUT_MS,
    );
    return NextResponse.json({
      status: "ok",
      firestore: "ok",
      time: new Date().toISOString(),
    });
  } catch {
    // Never leak the underlying error — this endpoint is unauthenticated.
    return NextResponse.json(
      {
        status: "degraded",
        firestore: "error",
        time: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
