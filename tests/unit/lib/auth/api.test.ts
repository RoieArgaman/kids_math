import { afterEach, describe, expect, it, vi } from "vitest";
import { apiMeResult } from "@/lib/auth/api";

// This mapping is the sole trigger for device-wide learner-data deletion: `unauthorized` tears
// down local storage, `error` must not. Collapsing the two — e.g. `if (!res.ok)` instead of
// `if (res.status === 401)` — would wipe every signed-in child's work on a transient 500.
// verifySession now reads Firestore on every authenticated request, so 500s are more reachable
// than they used to be.
function mockFetch(res: Partial<Response> | Error) {
  global.fetch = vi.fn(async () => {
    if (res instanceof Error) throw res;
    return res as Response;
  }) as unknown as typeof fetch;
}

afterEach(() => vi.restoreAllMocks());

describe("apiMeResult", () => {
  it("returns the user on 200", async () => {
    const user = { userId: "u1", username: "dana", role: "user" };
    mockFetch({ ok: true, status: 200, json: async () => user });
    expect(await apiMeResult()).toEqual({ status: "ok", user });
  });

  it("returns unauthorized on 401 — the only status that may destroy local data", async () => {
    mockFetch({ ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) });
    expect(await apiMeResult()).toEqual({ status: "unauthorized" });
  });

  it.each([
    ["500 (Firestore blip during the session read)", 500],
    ["503", 503],
    ["429", 429],
    ["403", 403],
  ])("returns error, NOT unauthorized, on %s", async (_label, status) => {
    mockFetch({ ok: false, status, json: async () => ({ error: "x" }) });
    expect(await apiMeResult()).toEqual({ status: "error" });
  });

  it("returns error when the network throws (offline)", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    expect(await apiMeResult()).toEqual({ status: "error" });
  });

  it("returns error when a 200 body fails to parse", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    });
    expect(await apiMeResult()).toEqual({ status: "error" });
  });
});
