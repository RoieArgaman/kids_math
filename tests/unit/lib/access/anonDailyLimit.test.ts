import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ANON_DAILY_USAGE_KEY,
  claimAnonDaySlot,
  clearAnonDailyUsage,
  isBlockedByAnonDailyLimit,
  readAnonDailyUsage,
} from "@/lib/access/anonDailyLimit";
import { clearLocalProgress } from "@/lib/user-data/api";

const TODAY = "2026-07-24";
const YESTERDAY = "2026-07-23";

afterEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("anonDailyLimit store", () => {
  it("treats a missing slot as free (never blocked)", () => {
    expect(readAnonDailyUsage()).toBeNull();
    expect(isBlockedByAnonDailyLimit("math", "day-1", TODAY)).toBe(false);
  });

  it("claims today's slot on first open", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    expect(readAnonDailyUsage()).toEqual({ date: TODAY, subject: "math", dayId: "day-1" });
  });

  it("allows re-opening the same day/subject", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    expect(isBlockedByAnonDailyLimit("math", "day-1", TODAY)).toBe(false);
  });

  it("blocks a different day in the same subject", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    expect(isBlockedByAnonDailyLimit("math", "day-2", TODAY)).toBe(true);
  });

  it("blocks a different subject", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    expect(isBlockedByAnonDailyLimit("english", "day-1", TODAY)).toBe(true);
    expect(isBlockedByAnonDailyLimit("science", "day-1", TODAY)).toBe(true);
  });

  it("is idempotent for the same day (never overwrites an existing same-date slot)", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    // A second (spurious/StrictMode) claim for a different day must NOT steal the slot.
    claimAnonDaySlot("english", "day-9", TODAY);
    expect(readAnonDailyUsage()).toEqual({ date: TODAY, subject: "math", dayId: "day-1" });
  });

  it("resets when the local date rolls over (a stale slot is free)", () => {
    claimAnonDaySlot("math", "day-1", YESTERDAY);
    // Yesterday's slot does not constrain today.
    expect(isBlockedByAnonDailyLimit("english", "day-5", TODAY)).toBe(false);
    // ...and claiming today overwrites the stale slot.
    claimAnonDaySlot("english", "day-5", TODAY);
    expect(readAnonDailyUsage()).toEqual({ date: TODAY, subject: "english", dayId: "day-5" });
  });

  it("fails open on a corrupt stored value (never blocks)", () => {
    window.localStorage.setItem(ANON_DAILY_USAGE_KEY, "{not json");
    expect(readAnonDailyUsage()).toBeNull();
    expect(isBlockedByAnonDailyLimit("math", "day-2", TODAY)).toBe(false);

    window.localStorage.setItem(ANON_DAILY_USAGE_KEY, JSON.stringify({ date: TODAY, subject: "history", dayId: "day-1" }));
    expect(readAnonDailyUsage()).toBeNull();
    expect(isBlockedByAnonDailyLimit("math", "day-2", TODAY)).toBe(false);
  });

  it("uses getTodayDate() when no explicit day is passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T09:00:00"));
    claimAnonDaySlot("math", "day-1");
    expect(isBlockedByAnonDailyLimit("math", "day-2")).toBe(true);
    // Advance past midnight → the slot is stale → free again.
    vi.setSystemTime(new Date("2026-07-25T09:00:00"));
    expect(isBlockedByAnonDailyLimit("math", "day-2")).toBe(false);
  });

  it("clearAnonDailyUsage removes the slot (test-only helper)", () => {
    claimAnonDaySlot("math", "day-1", TODAY);
    clearAnonDailyUsage();
    expect(readAnonDailyUsage()).toBeNull();
  });
});

describe("anon slot survives progress teardown (case #5 invariant)", () => {
  it("clearLocalProgress() must NOT remove the anon daily-limit key", () => {
    // If this fails, a login→logout cycle would mint a fresh free day (the lock's
    // own CTA is "log in"): the slot MUST outlive the logout teardown.
    claimAnonDaySlot("math", "day-1", TODAY);
    clearLocalProgress();
    expect(readAnonDailyUsage()).toEqual({ date: TODAY, subject: "math", dayId: "day-1" });
  });
});
