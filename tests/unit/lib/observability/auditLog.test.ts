// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { FakeFirestore } from "../../app/api/fakeFirestore";

const { holder } = vi.hoisted(() => ({ holder: { db: null as unknown } }));
vi.mock("@/lib/firestore/admin", () => ({ getFirestore: () => holder.db }));

import { writeAuditLog } from "@/lib/observability/auditLog";

describe("writeAuditLog", () => {
  it("appends one row with the expected fields", async () => {
    const db = new FakeFirestore();
    holder.db = db;

    await writeAuditLog({
      actorId: "admin1",
      action: "user.create",
      targetId: "u2",
      meta: { role: "user" },
    });

    const rows = db.docs("audit_log");
    expect(rows).toHaveLength(1);
    const { data } = rows[0];
    expect(data.actorId).toBe("admin1");
    expect(data.action).toBe("user.create");
    expect(data.targetId).toBe("u2");
    expect((data.meta as Record<string, unknown>).role).toBe("user");
    expect(typeof data.at).toBe("string");
  });

  it("defaults missing targetId/meta to null/{}", async () => {
    const db = new FakeFirestore();
    holder.db = db;

    await writeAuditLog({ actorId: "admin1", action: "user.delete" });

    const { data } = db.docs("audit_log")[0];
    expect(data.targetId).toBeNull();
    expect(data.meta).toEqual({});
  });

  it("is fail-safe: resolves without throwing when Firestore is down", async () => {
    holder.db = new FakeFirestore({ throwOnAccess: new Error("down") });

    await expect(
      writeAuditLog({ actorId: "admin1", action: "user.unlock", targetId: "u2" }),
    ).resolves.toBeUndefined();
  });
});
