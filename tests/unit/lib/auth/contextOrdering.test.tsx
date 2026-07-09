import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

// Record call order across api + serverSync so we can assert push-then-pull.
const calls: string[] = [];

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/auth/api", () => ({
  apiMe: vi.fn(async () => ({ id: "u1", username: "kid" })),
  apiLogin: vi.fn(),
  apiLogout: vi.fn(),
}));

vi.mock("@/lib/auth/serverSync", () => ({
  suspendSync: vi.fn(() => calls.push("suspendSync")),
  resumeSync: vi.fn(() => calls.push("resumeSync")),
  registerSyncCallback: vi.fn(() => calls.push("registerSyncCallback")),
  unregisterSyncCallback: vi.fn(),
  flushSync: vi.fn(),
}));

vi.mock("@/lib/user-data/api", () => ({
  buildBundleFromLocalStorage: vi.fn(() => ({ bundleVersion: 4 })),
  fetchUserProgress: vi.fn(async () => {
    calls.push("pull");
    return { bundleVersion: 4 };
  }),
  pushUserProgress: vi.fn(async () => {
    calls.push("push");
    return true;
  }),
  hydrateLocalStorageFromBundle: vi.fn(() => calls.push("hydrate")),
  restoreSnapshotFromSession: vi.fn(),
  saveSnapshotToSession: vi.fn(),
  snapshotLocalStorage: vi.fn(() => ({})),
  beaconUserProgress: vi.fn(),
}));

import { AuthProvider } from "@/lib/auth/context";

beforeEach(() => {
  calls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider mount ordering", () => {
  it("suspends, pushes local, then pulls merged, hydrates, arms callback, resumes", async () => {
    render(
      <AuthProvider>
        <span data-testid="child">ok</span>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(calls).toContain("registerSyncCallback");
    });

    const pushIdx = calls.indexOf("push");
    const pullIdx = calls.indexOf("pull");
    const registerIdx = calls.indexOf("registerSyncCallback");
    const suspendIdx = calls.indexOf("suspendSync");
    const resumeIdx = calls.indexOf("resumeSync");

    expect(suspendIdx).toBeGreaterThanOrEqual(0);
    // push before pull (the core fix — no stale re-push race)
    expect(pushIdx).toBeGreaterThanOrEqual(0);
    expect(pullIdx).toBeGreaterThan(pushIdx);
    // callback armed after the pull, and resume after that
    expect(registerIdx).toBeGreaterThan(pullIdx);
    expect(resumeIdx).toBeGreaterThan(registerIdx);
    // suspend happened before the push
    expect(suspendIdx).toBeLessThan(pushIdx);
  });
});
