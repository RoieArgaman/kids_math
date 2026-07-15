// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { signToken, verifyToken } from "@/lib/auth/jwt.server";
import type { AuthUser } from "@/lib/auth/types";

const USER: AuthUser = { userId: "u1", username: "Dana", role: "user" };
const SECRET = "test-secret-value-at-least-32-chars-long!!";

beforeAll(() => {
  process.env.JWT_SECRET = SECRET;
});

describe("jwt tokenVersion (S4)", () => {
  it("roundtrips the embedded tokenVersion", async () => {
    const token = await signToken(USER, 3);
    const claims = await verifyToken(token);
    expect(claims).toEqual({ ...USER, tokenVersion: 3 });
  });

  it("defaults to version 0 when not supplied", async () => {
    const claims = await verifyToken(await signToken(USER));
    expect(claims?.tokenVersion).toBe(0);
  });

  it("treats a LEGACY token with no tokenVersion claim as version 0 (backward-compat)", async () => {
    // A pre-Phase-1 token: same shape as before, but no tokenVersion claim.
    const legacy = await new SignJWT({ userId: "u1", username: "Dana", role: "user" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .setIssuedAt()
      .sign(new TextEncoder().encode(SECRET));
    const claims = await verifyToken(legacy);
    expect(claims).toEqual({ ...USER, tokenVersion: 0 });
  });

  it("returns null for a tampered / wrong-secret token", async () => {
    const forged = await new SignJWT({ userId: "u1", username: "Dana", role: "user", tokenVersion: 0 })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode("a-different-secret-value-32-chars-long!!"));
    expect(await verifyToken(forged)).toBeNull();
  });
});
