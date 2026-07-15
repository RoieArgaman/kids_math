// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "../../app/api/fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import {
  checkLockout,
  clearLockout,
  recordFailedAttempt,
  LOCKOUT_MAX_FAILURES,
  LOCKOUT_COOLDOWN_MS,
} from "@/lib/security/accountLockout";

const USER = "dana";

beforeEach(() => {
  holder.db = new FakeFirestore();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function failNTimes(n: number) {
  let last;
  for (let i = 0; i < n; i++) last = await recordFailedAttempt(USER);
  return last!;
}

describe("accountLockout", () => {
  it("is not locked initially and reports full attempts remaining", async () => {
    expect(await checkLockout(USER)).toEqual({
      locked: false,
      attemptsRemaining: LOCKOUT_MAX_FAILURES,
    });
  });

  it("locks after LOCKOUT_MAX_FAILURES consecutive failures", async () => {
    const beforeLast = await failNTimes(LOCKOUT_MAX_FAILURES - 1);
    expect(beforeLast.locked).toBe(false);
    expect(beforeLast.attemptsRemaining).toBe(1); // "one more try"

    const last = await recordFailedAttempt(USER);
    expect(last.locked).toBe(true);
    expect(last.retryAfterMs).toBe(LOCKOUT_COOLDOWN_MS);

    const status = await checkLockout(USER);
    expect(status.locked).toBe(true);
  });

  it("unlocks once the 1-minute cooldown elapses", async () => {
    const t0 = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(t0);
    await failNTimes(LOCKOUT_MAX_FAILURES);
    expect((await checkLockout(USER)).locked).toBe(true);

    // Still locked at 59s, unlocked at 60s.
    vi.setSystemTime(t0 + LOCKOUT_COOLDOWN_MS - 1000);
    expect((await checkLockout(USER)).locked).toBe(true);
    vi.setSystemTime(t0 + LOCKOUT_COOLDOWN_MS);
    expect((await checkLockout(USER)).locked).toBe(false);
  });

  it("clearLockout resets immediately (admin unlock / password reset / success)", async () => {
    await failNTimes(LOCKOUT_MAX_FAILURES);
    expect((await checkLockout(USER)).locked).toBe(true);
    await clearLockout(USER);
    expect(await checkLockout(USER)).toEqual({ locked: false, attemptsRemaining: LOCKOUT_MAX_FAILURES });
  });

  it("fails OPEN on a Firestore error (never locks everyone out)", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("firestore down") });
    expect(await checkLockout(USER)).toEqual({ locked: false, attemptsRemaining: LOCKOUT_MAX_FAILURES });
    expect((await recordFailedAttempt(USER)).locked).toBe(false);
    await expect(clearLockout(USER)).resolves.toBeUndefined();
  });
});
