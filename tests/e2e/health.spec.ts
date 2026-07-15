import { expect, test } from "@playwright/test";

test("health endpoint responds with the readiness contract", async ({ request }) => {
  const res = await request.get("/api/health");
  // The CI e2e server has no Firestore backend (other specs mock Firestore at the network
  // layer; this real request does not), so the probe legitimately reports "degraded" (503)
  // there and "ok" (200) where Firestore is reachable. Either way the route must answer with
  // its documented contract — that is what this smoke test guards.
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(["ok", "degraded"]).toContain(body.status);
  expect(["ok", "error"]).toContain(body.firestore);
  expect(typeof body.time).toBe("string");
});
