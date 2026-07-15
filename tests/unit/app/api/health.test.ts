// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "./fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { GET as health } from "@/app/api/health/route";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GET /api/health", () => {
  it("returns 200 ok when Firestore is reachable", async () => {
    holder.db = new FakeFirestore();
    const res = await health();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; firestore: string; time: string };
    expect(body).toMatchObject({ status: "ok", firestore: "ok" });
    expect(typeof body.time).toBe("string");
  });

  it("returns 503 degraded when the Firestore probe throws", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });
    const res = await health();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string; firestore: string };
    expect(body).toMatchObject({ status: "degraded", firestore: "error" });
  });

  it("returns 503 degraded when the Firestore probe times out (withTimeout guard)", async () => {
    vi.useFakeTimers();
    // A backend whose get() never settles → the timeout must win and surface as degraded.
    holder.db = {
      collection: () => ({ doc: () => ({ get: () => new Promise(() => {}) }) }),
    };
    const pending = health();
    await vi.advanceTimersByTimeAsync(1500);
    const res = await pending;
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("degraded");
  });

  it("returns 503 degraded when the Firestore probe rejects asynchronously", async () => {
    // get() returns a REJECTED promise (vs. a synchronous throw) → exercises the
    // withTimeout rejection path, not just the outer try/catch.
    holder.db = {
      collection: () => ({ doc: () => ({ get: () => Promise.reject(new Error("async fail")) }) }),
    };
    const res = await health();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { status: string; firestore: string };
    expect(body).toMatchObject({ status: "degraded", firestore: "error" });
  });

  it("never leaks the underlying error detail in the 503 body (unauthenticated endpoint)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("secret-internal-detail") });
    const res = await health();
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain("secret-internal-detail");
  });
});
