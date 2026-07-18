import { describe, expect, it } from "vitest";

import { buildUserExport, exportFileName, type RawDoc } from "@/lib/compliance/export";

const USER: RawDoc = {
  id: "u2",
  data: {
    username: "Kid",
    usernameLower: "kid",
    passwordHash: "$2a$12$super-secret-hash",
    tokenVersion: 7,
    role: "user",
    createdAt: "2024-02-01",
  },
};

const PROGRESS: RawDoc = {
  id: "u2",
  data: { bundleVersion: 4, updatedAt: "2024-06-01", streak: null },
};

describe("buildUserExport", () => {
  it("projects exactly the allow-listed keys", () => {
    const out = buildUserExport(USER, PROGRESS);
    expect(Object.keys(out).sort()).toEqual([
      "createdAt",
      "progress",
      "role",
      "status",
      "userId",
      "username",
    ]);
    expect(out).toMatchObject({
      userId: "u2",
      username: "Kid",
      role: "user",
      createdAt: "2024-02-01",
      status: "active",
    });
  });

  it("never carries passwordHash, tokenVersion or usernameLower — even serialized", () => {
    const serialized = JSON.stringify(buildUserExport(USER, PROGRESS));
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("super-secret-hash");
    expect(serialized).not.toContain("tokenVersion");
    expect(serialized).not.toContain("usernameLower");
  });

  it("stays closed when the user doc grows a new secret field", () => {
    const withNewSecret: RawDoc = {
      id: "u2",
      data: { ...USER.data, recoveryCodeHash: "brand-new-secret" },
    };
    expect(JSON.stringify(buildUserExport(withNewSecret, null))).not.toContain("brand-new-secret");
  });

  it("includes the progress bundle verbatim", () => {
    expect(buildUserExport(USER, PROGRESS).progress).toEqual({
      bundleVersion: 4,
      updatedAt: "2024-06-01",
      streak: null,
    });
  });

  it("returns null progress when the learner never synced", () => {
    expect(buildUserExport(USER, null).progress).toBeNull();
  });

  it("defaults status to active on a pre-Phase-3 doc and preserves an explicit one", () => {
    expect(buildUserExport(USER, null).status).toBe("active");
    const deleted: RawDoc = { id: "u2", data: { ...USER.data, status: "deleted" } };
    expect(buildUserExport(deleted, null).status).toBe("deleted");
  });

  it("keeps the admin role and falls back to 'user' for anything unknown", () => {
    expect(buildUserExport({ id: "a", data: { role: "admin" } }, null).role).toBe("admin");
    expect(buildUserExport({ id: "a", data: { role: "wizard" } }, null).role).toBe("user");
    expect(buildUserExport({ id: "a", data: {} }, null).role).toBe("user");
  });

  it("degrades to empty strings for missing/non-string scalars", () => {
    const out = buildUserExport({ id: "a", data: { username: 42, createdAt: null } }, null);
    expect(out).toMatchObject({ userId: "a", username: "", createdAt: "" });
  });

  it("tolerates a doc with no data at all", () => {
    expect(buildUserExport({ id: "a", data: undefined }, null).userId).toBe("a");
  });

  it("copies the progress bundle so later mutations cannot alter the export", () => {
    const mutable = { bundleVersion: 4 };
    const out = buildUserExport(USER, { id: "u2", data: mutable });
    mutable.bundleVersion = 1;
    expect(out.progress).toEqual({ bundleVersion: 4 });
  });
});

describe("exportFileName", () => {
  it("embeds the id and the date", () => {
    expect(exportFileName("u2", new Date("2026-07-18T10:00:00Z"))).toBe(
      "kids-math-export-u2-2026-07-18.json",
    );
  });

  it("strips characters that could break the Content-Disposition header", () => {
    expect(exportFileName('a"b;c /d', new Date("2026-07-18T10:00:00Z"))).toBe(
      "kids-math-export-abcd-2026-07-18.json",
    );
  });

  it("falls back to a placeholder when nothing survives sanitization", () => {
    expect(exportFileName('"', new Date("2026-07-18T10:00:00Z"))).toBe(
      "kids-math-export-user-2026-07-18.json",
    );
  });
});
