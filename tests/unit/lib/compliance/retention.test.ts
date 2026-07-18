import { describe, expect, it } from "vitest";
import {
  evaluateAccounts,
  selectExpiredAccounts,
  type RetentionPolicy,
  type RetentionUser,
} from "@/lib/compliance/retention";

/**
 * Retention selection is pure, so every case here pins a fixed `now` — no fake timers, no clock
 * dependence. NOW is an arbitrary but stable instant; ages are expressed relative to it.
 */
const NOW = Date.parse("2026-07-18T00:00:00.000Z");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const POLICY: RetentionPolicy = { inactiveDays: 365 };

/** ISO timestamp for an account created exactly `days` before NOW (fractions allowed). */
function agedDays(days: number): string {
  return new Date(NOW - days * MS_PER_DAY).toISOString();
}

function ids(users: RetentionUser[]): string[] {
  return users.map((user) => user.userId);
}

describe("selectExpiredAccounts", () => {
  it("selects an account older than the retention window", () => {
    const users: RetentionUser[] = [{ userId: "old", createdAt: agedDays(400) }];
    expect(ids(selectExpiredAccounts(users, NOW, POLICY))).toEqual(["old"]);
  });

  it("spares an account younger than the retention window", () => {
    const users: RetentionUser[] = [{ userId: "young", createdAt: agedDays(10) }];
    expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
  });

  it("treats an absent status as active and still selects it", () => {
    const users: RetentionUser[] = [{ userId: "legacy", createdAt: agedDays(400) }];
    expect(ids(selectExpiredAccounts(users, NOW, POLICY))).toEqual(["legacy"]);
  });

  it("selects deactivated accounts — deactivation is not deletion", () => {
    const users: RetentionUser[] = [
      { userId: "parked", createdAt: agedDays(400), status: "deactivated" },
    ];
    expect(ids(selectExpiredAccounts(users, NOW, POLICY))).toEqual(["parked"]);
  });

  it("preserves input order and returns the original records", () => {
    const users: RetentionUser[] = [
      { userId: "a", createdAt: agedDays(400) },
      { userId: "skip", createdAt: agedDays(1) },
      { userId: "b", createdAt: agedDays(999), status: "active" },
    ];
    const selected = selectExpiredAccounts(users, NOW, POLICY);
    expect(ids(selected)).toEqual(["a", "b"]);
    expect(selected[0]).toBe(users[0]);
  });

  it("returns an empty array for an empty snapshot", () => {
    expect(selectExpiredAccounts([], NOW, POLICY)).toEqual([]);
  });

  it("does not double-select a duplicated userId in the same snapshot", () => {
    const users: RetentionUser[] = [
      { userId: "dupe", createdAt: agedDays(400) },
      { userId: "dupe", createdAt: agedDays(1) },
    ];
    // Only the aged copy qualifies — matching is positional, not by id.
    const selected = selectExpiredAccounts(users, NOW, POLICY);
    expect(selected).toHaveLength(1);
    expect(selected[0]?.createdAt).toBe(agedDays(400));
  });
});

describe("exclusions", () => {
  it("never selects an admin, however old", () => {
    const users: RetentionUser[] = [
      { userId: "admin", createdAt: agedDays(10_000), role: "admin" },
    ];
    expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
    expect(evaluateAccounts(users, NOW, POLICY)[0]).toEqual({
      kind: "skip",
      userId: "admin",
      reason: "admin",
    });
  });

  it("excludes an admin even when already soft-deleted (admin wins the reason)", () => {
    const users: RetentionUser[] = [
      { userId: "admin", createdAt: agedDays(10_000), role: "admin", status: "deleted" },
    ];
    expect(evaluateAccounts(users, NOW, POLICY)[0]).toEqual({
      kind: "skip",
      userId: "admin",
      reason: "admin",
    });
  });

  it("still selects a non-admin role that is not 'admin'", () => {
    const users: RetentionUser[] = [{ userId: "u", createdAt: agedDays(400), role: "user" }];
    expect(ids(selectExpiredAccounts(users, NOW, POLICY))).toEqual(["u"]);
  });

  it("excludes an account already marked deleted — nothing to do", () => {
    const users: RetentionUser[] = [
      { userId: "gone", createdAt: agedDays(400), status: "deleted" },
    ];
    expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
    expect(evaluateAccounts(users, NOW, POLICY)[0]).toEqual({
      kind: "skip",
      userId: "gone",
      reason: "already-deleted",
    });
  });

  it("never selects an account with a missing createdAt — age is unprovable", () => {
    const users: RetentionUser[] = [{ userId: "nodate" }];
    expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
    expect(evaluateAccounts(users, NOW, POLICY)[0]).toEqual({
      kind: "skip",
      userId: "nodate",
      reason: "missing-created-at",
    });
  });

  it.each(["not-a-date", "", "2026-13-45T99:99:99Z"])(
    "never selects an account with an unparseable createdAt (%j)",
    (createdAt) => {
      const users: RetentionUser[] = [{ userId: "bad", createdAt }];
      expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
      expect(evaluateAccounts(users, NOW, POLICY)[0]).toMatchObject({
        kind: "skip",
        reason: "invalid-created-at",
      });
    },
  );

  it("does not select a future-dated account (clock skew is handled on the safe side)", () => {
    const users: RetentionUser[] = [{ userId: "future", createdAt: agedDays(-30) }];
    expect(selectExpiredAccounts(users, NOW, POLICY)).toEqual([]);
    expect(evaluateAccounts(users, NOW, POLICY)[0]).toMatchObject({
      kind: "skip",
      reason: "within-retention",
    });
  });
});

describe("boundary semantics (>=, inclusive)", () => {
  it("SELECTS an account aged exactly inactiveDays", () => {
    const users: RetentionUser[] = [{ userId: "exact", createdAt: agedDays(365) }];
    expect(ids(selectExpiredAccounts(users, NOW, POLICY))).toEqual(["exact"]);
  });

  it("SELECTS an account one millisecond past the boundary", () => {
    const createdAt = new Date(NOW - 365 * MS_PER_DAY - 1).toISOString();
    expect(ids(selectExpiredAccounts([{ userId: "past", createdAt }], NOW, POLICY))).toEqual([
      "past",
    ]);
  });

  it("SPARES an account one millisecond short of the boundary", () => {
    const createdAt = new Date(NOW - 365 * MS_PER_DAY + 1).toISOString();
    expect(selectExpiredAccounts([{ userId: "short", createdAt }], NOW, POLICY)).toEqual([]);
  });

  it("selects everything when inactiveDays is 0 and the account exists now", () => {
    const users: RetentionUser[] = [{ userId: "brand-new", createdAt: agedDays(0) }];
    expect(ids(selectExpiredAccounts(users, NOW, { inactiveDays: 0 }))).toEqual(["brand-new"]);
  });
});

describe("evaluateAccounts", () => {
  it("returns one decision per input, in input order", () => {
    const users: RetentionUser[] = [
      { userId: "a", createdAt: agedDays(400) },
      { userId: "b" },
      { userId: "c", createdAt: agedDays(1) },
    ];
    const decisions = evaluateAccounts(users, NOW, POLICY);
    expect(decisions).toHaveLength(3);
    expect(decisions.map((d) => d.userId)).toEqual(["a", "b", "c"]);
    expect(decisions.map((d) => d.kind)).toEqual(["select", "skip", "skip"]);
  });

  it("reports the computed age on both select and within-retention decisions", () => {
    const decisions = evaluateAccounts(
      [
        { userId: "old", createdAt: agedDays(400) },
        { userId: "young", createdAt: agedDays(30) },
      ],
      NOW,
      POLICY,
    );
    expect(decisions[0]).toEqual({ kind: "select", userId: "old", ageDays: 400 });
    expect(decisions[1]).toEqual({
      kind: "skip",
      userId: "young",
      reason: "within-retention",
      ageDays: 30,
    });
  });
});
