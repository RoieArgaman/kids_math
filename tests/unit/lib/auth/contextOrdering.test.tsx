import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Records the order of the important side effects so we can assert the
// server-authoritative reconcile behaves per the plan.
const calls: string[] = [];

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const apiMeResult = vi.fn();
const apiLogin = vi.fn();
const apiLogout = vi.fn(async () => {
  calls.push("apiLogout");
});

vi.mock("@/lib/auth/api", () => ({
  apiMeResult: (...args: unknown[]) => apiMeResult(...args),
  apiLogin: (...args: unknown[]) => apiLogin(...args),
  apiLogout: (...args: unknown[]) => apiLogout(...args),
}));

// Stateful serverSync mock: real epoch + primed so the epoch guard is exercised.
let epoch = 0;
let primed = false;
vi.mock("@/lib/auth/serverSync", () => ({
  suspendSync: vi.fn(() => calls.push("suspendSync")),
  resumeSync: vi.fn(() => calls.push("resumeSync")),
  registerSyncCallback: vi.fn(() => calls.push("register")),
  unregisterSyncCallback: vi.fn(() => calls.push("unregister")),
  flushSync: vi.fn(),
  bumpAuthEpoch: vi.fn(() => {
    epoch += 1;
    calls.push("bump");
    return epoch;
  }),
  getAuthEpoch: vi.fn(() => epoch),
  isSyncActive: vi.fn(() => true),
  isSyncPrimed: vi.fn(() => primed),
  setSyncPrimed: vi.fn((v: boolean) => {
    primed = v;
    calls.push(`prime:${v}`);
  }),
}));

const getLocalOwner = vi.fn<[], string | null>(() => null);
const fetchUserProgress = vi.fn(async () => {
  calls.push("pull");
  return { bundleVersion: 4 };
});
const fetchUserProgressResult = vi.fn(async () => {
  calls.push("pullResult");
  return { status: "ok" as const, bundle: { bundleVersion: 4 } };
});

vi.mock("@/lib/user-data/api", () => ({
  buildBundleFromLocalStorage: vi.fn(() => ({ bundleVersion: 4 })),
  pushUserProgress: vi.fn(async () => {
    calls.push("push");
    return true;
  }),
  fetchUserProgress: (...args: unknown[]) => fetchUserProgress(...(args as [])),
  fetchUserProgressResult: (...args: unknown[]) => fetchUserProgressResult(...(args as [])),
  hydrateLocalStorageFromBundle: vi.fn(() => calls.push("hydrate")),
  replaceLocalStorageFromBundle: vi.fn(() => calls.push("replace")),
  clearLocalProgress: vi.fn(() => calls.push("clear")),
  getLocalOwner: (...args: unknown[]) => getLocalOwner(...(args as [])),
  setLocalOwner: vi.fn(() => calls.push("setOwner")),
  clearLocalOwner: vi.fn(() => calls.push("clearOwner")),
  beaconUserProgress: vi.fn(),
}));

vi.mock("@/lib/completion/reconcile", () => ({
  clearReconcileGuards: vi.fn(() => calls.push("guards")),
}));

import { AuthProvider, useAuth } from "@/lib/auth/context";

function Consumer() {
  const { isLoggedIn, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="logged-in">{isLoggedIn ? "yes" : "no"}</span>
      <button data-testid="do-login" onClick={() => void login("kid", "pw")}>
        login
      </button>
      <button data-testid="do-logout" onClick={() => void logout()}>
        logout
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  calls.length = 0;
  epoch = 0;
  primed = false;
  apiMeResult.mockResolvedValue({ status: "unauthorized" });
  apiLogin.mockResolvedValue({ ok: false, error: "x" });
  getLocalOwner.mockReturnValue(null);
  fetchUserProgress.mockImplementation(async () => {
    calls.push("pull");
    return { bundleVersion: 4 };
  });
  fetchUserProgressResult.mockImplementation(async () => {
    calls.push("pullResult");
    return { status: "ok" as const, bundle: { bundleVersion: 4 } };
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AuthProvider — server-authoritative reconcile on mount", () => {
  it("foreign/anon device with a server bundle: clears + hydrates (replace), never pushes, then primes", async () => {
    apiMeResult.mockResolvedValue({ status: "ok", user: { userId: "u1", username: "kid", role: "user" } });
    getLocalOwner.mockReturnValue(null); // anonymous local

    renderProvider();
    await waitFor(() => expect(calls).toContain("register"));

    expect(calls).toContain("replace");
    expect(calls).not.toContain("push"); // never merge foreign local up
    expect(calls).not.toContain("pull"); // used the discriminated fetch, not the merge pull
    // prime AFTER the replace, register + resume after prime
    expect(calls.indexOf("prime:true")).toBeGreaterThan(calls.indexOf("replace"));
    expect(calls.indexOf("register")).toBeGreaterThan(calls.indexOf("prime:true"));
    expect(calls.indexOf("resumeSync")).toBeGreaterThan(calls.indexOf("register"));
    expect(calls).toContain("setOwner");
  });

  it("same-user device: pushes local (merge) then pulls, preserving offline work", async () => {
    apiMeResult.mockResolvedValue({ status: "ok", user: { userId: "u1", username: "kid", role: "user" } });
    getLocalOwner.mockReturnValue("u1"); // same user returning

    renderProvider();
    await waitFor(() => expect(calls).toContain("register"));

    const pushIdx = calls.indexOf("push");
    const pullIdx = calls.indexOf("pull");
    expect(pushIdx).toBeGreaterThanOrEqual(0);
    expect(pullIdx).toBeGreaterThan(pushIdx); // push-then-pull
    expect(calls).toContain("hydrate");
    expect(calls).not.toContain("clear"); // same-user work is never wiped
    expect(calls.indexOf("prime:true")).toBeGreaterThan(pullIdx);
  });

  it("foreign device, server confirmed empty: clears and primes, no hydrate", async () => {
    apiMeResult.mockResolvedValue({ status: "ok", user: { userId: "u1", username: "kid", role: "user" } });
    getLocalOwner.mockReturnValue(null);
    fetchUserProgressResult.mockImplementation(async () => {
      calls.push("pullResult");
      return { status: "empty" as const };
    });

    renderProvider();
    await waitFor(() => expect(calls).toContain("register"));

    expect(calls).toContain("clear");
    expect(calls).not.toContain("hydrate");
    expect(calls).not.toContain("replace");
    expect(calls).toContain("prime:true");
  });

  it("foreign device, fetch ERROR: clears for confidentiality but stays UNPRIMED", async () => {
    apiMeResult.mockResolvedValue({ status: "ok", user: { userId: "u1", username: "kid", role: "user" } });
    getLocalOwner.mockReturnValue(null);
    fetchUserProgressResult.mockImplementation(async () => {
      calls.push("pullResult");
      return { status: "error" as const };
    });

    renderProvider();
    await waitFor(() => expect(calls).toContain("register"));

    expect(calls).toContain("clear");
    expect(calls).toContain("prime:false");
    expect(calls).not.toContain("prime:true"); // never claim primed on an error
  });

  it("does nothing when there is no session (anonymous)", async () => {
    apiMeResult.mockResolvedValue({ status: "unauthorized" });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("no"));
    expect(calls).not.toContain("register");
    expect(calls).not.toContain("replace");
    expect(calls).not.toContain("clear");
  });

  // A soft-deleted or deactivated child must not leave their workbook readable to whoever opens
  // the browser next — school and family devices are shared.
  describe("revocation teardown", () => {
    it("wipes the device when a signed-in session comes back 401", async () => {
      apiMeResult.mockResolvedValue({ status: "unauthorized" });
      getLocalOwner.mockReturnValue("u1"); // this device WAS signed in

      renderProvider();
      await waitFor(() => expect(calls).toContain("clear"));

      expect(calls).toContain("bump");
      expect(calls).toContain("clearOwner");
      expect(calls).toContain("guards");
      expect(screen.getByTestId("logged-in")).toHaveTextContent("no");
    });

    it("does NOT wipe an anonymous visitor (no owner marker)", async () => {
      apiMeResult.mockResolvedValue({ status: "unauthorized" });
      getLocalOwner.mockReturnValue(null);

      renderProvider();
      await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("no"));
      expect(calls).not.toContain("clear");
      expect(calls).not.toContain("clearOwner");
    });

    it("does NOT wipe on a network error, even for a signed-in device", async () => {
      // The offline case is the reason `error` and `unauthorized` are distinct kinds: collapsing
      // them would destroy a logged-in child's work on a wifi blip.
      apiMeResult.mockResolvedValue({ status: "error" });
      getLocalOwner.mockReturnValue("u1");

      renderProvider();
      await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("no"));
      expect(calls).not.toContain("clear");
      expect(calls).not.toContain("clearOwner");
    });
  });
});

describe("AuthProvider — login", () => {
  it("foreign login clears + hydrates the incoming user's server data, bumps epoch, sets user", async () => {
    apiMeResult.mockResolvedValue({ status: "unauthorized" }); // start logged out
    apiLogin.mockResolvedValue({ ok: true, user: { userId: "u2", username: "b", role: "user" } });
    getLocalOwner.mockReturnValue("u1"); // a DIFFERENT prior student's local data

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("no"));
    calls.length = 0;

    await userEvent.click(screen.getByTestId("do-login"));
    await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("yes"));

    expect(calls[0]).toBe("bump"); // identity boundary bumped first
    expect(calls).toContain("replace"); // foreign local replaced by u2's server truth
    expect(calls).not.toContain("push");
    expect(calls).toContain("setOwner");
  });
});

describe("AuthProvider — logout", () => {
  it("wipes to zero: bump, disarm, apiLogout, clear progress + guards + owner, user=null", async () => {
    apiMeResult.mockResolvedValue({ status: "ok", user: { userId: "u1", username: "kid", role: "user" } });
    getLocalOwner.mockReturnValue("u1");

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("yes"));
    calls.length = 0;

    await userEvent.click(screen.getByTestId("do-logout"));
    await waitFor(() => expect(screen.getByTestId("logged-in")).toHaveTextContent("no"));

    expect(calls).toContain("bump");
    expect(calls).toContain("prime:false");
    expect(calls).toContain("unregister");
    expect(calls).toContain("apiLogout");
    expect(calls).toContain("clear");
    expect(calls).toContain("guards");
    expect(calls).toContain("clearOwner");
    // Local must be wiped SYNCHRONOUSLY before the network logout, so no async
    // pull can interleave a hydrate before the clear.
    expect(calls.indexOf("clear")).toBeLessThan(calls.indexOf("apiLogout"));
    expect(calls.indexOf("unregister")).toBeLessThan(calls.indexOf("clear"));
  });
});
