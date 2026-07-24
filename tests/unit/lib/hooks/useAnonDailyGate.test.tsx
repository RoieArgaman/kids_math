import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnonDailyGate } from "@/lib/hooks/useAnonDailyGate";
import { claimAnonDaySlot, readAnonDailyUsage } from "@/lib/access/anonDailyLimit";

const authState = { isLoggedIn: false, isLoading: false };
const previewState = { previewAll: false, isRouteReady: true };

vi.mock("@/lib/auth/context", () => ({
  useAuth: () => authState,
}));
vi.mock("@/lib/hooks/usePreviewAll", () => ({
  usePreviewAll: () => previewState,
}));

function setAuth(next: Partial<typeof authState>) {
  Object.assign(authState, next);
}
function setPreview(next: Partial<typeof previewState>) {
  Object.assign(previewState, next);
}

afterEach(() => {
  window.localStorage.clear();
  setAuth({ isLoggedIn: false, isLoading: false });
  setPreview({ previewAll: false, isRouteReady: true });
});

describe("useAnonDailyGate", () => {
  it("stays 'loading' while auth is unsettled — and never claims a slot", () => {
    setAuth({ isLoading: true });
    const { result } = renderHook(() => useAnonDailyGate("math", "day-2"));
    expect(result.current).toBe("loading");
    expect(readAnonDailyUsage()).toBeNull();
  });

  it("stays 'loading' until the client route is ready", () => {
    setPreview({ isRouteReady: false });
    const { result } = renderHook(() => useAnonDailyGate("math", "day-2"));
    expect(result.current).toBe("loading");
    expect(readAnonDailyUsage()).toBeNull();
  });

  it("never blocks a logged-in user, even past the cap — and does not claim", () => {
    claimAnonDaySlot("math", "day-1"); // cap already used anonymously
    setAuth({ isLoggedIn: true });
    const { result } = renderHook(() => useAnonDailyGate("english", "day-3"));
    expect(result.current).toBe("allowed");
    // Logged-in path must not touch the anon slot.
    expect(readAnonDailyUsage()).toEqual(
      expect.objectContaining({ subject: "math", dayId: "day-1" }),
    );
  });

  it("never blocks under the previewAll QA bypass", () => {
    claimAnonDaySlot("math", "day-1");
    setPreview({ previewAll: true });
    const { result } = renderHook(() => useAnonDailyGate("english", "day-3"));
    expect(result.current).toBe("allowed");
  });

  it("allows and claims the first anonymous day", () => {
    const { result } = renderHook(() => useAnonDailyGate("math", "day-1"));
    expect(result.current).toBe("allowed");
    expect(readAnonDailyUsage()).toEqual(
      expect.objectContaining({ subject: "math", dayId: "day-1" }),
    );
  });

  it("blocks a second, different day for an anonymous visitor", () => {
    claimAnonDaySlot("math", "day-1");
    const { result } = renderHook(() => useAnonDailyGate("math", "day-2"));
    expect(result.current).toBe("blocked");
  });

  it("does NOT claim when the day is inaccessible (canClaim=false), even if allowed", () => {
    // A not-found or progression-locked day: the visitor never gets to use it, so the
    // free slot must not be burned. The gate still resolves "allowed" (no conflict),
    // but nothing is written.
    const { result } = renderHook(() => useAnonDailyGate("math", "day-3", false));
    expect(result.current).toBe("allowed");
    expect(readAnonDailyUsage()).toBeNull();
  });

  it("claims once the same day becomes accessible after being locked", () => {
    // Locked first render → no claim; then unlocked → claims. Proves the slot is tied
    // to actual access, not mere navigation.
    const first = renderHook(({ can }) => useAnonDailyGate("math", "day-3", can), {
      initialProps: { can: false },
    });
    expect(readAnonDailyUsage()).toBeNull();
    first.rerender({ can: true });
    expect(readAnonDailyUsage()).toEqual(
      expect.objectContaining({ subject: "math", dayId: "day-3" }),
    );
  });
});
