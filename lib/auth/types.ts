export type UserRole = "user" | "admin";

export interface AuthUser {
  userId: string;
  username: string;
  role: UserRole;
}

/**
 * Server-only session claims: the public `AuthUser` plus the revocation `tokenVersion`
 * carried in the JWT (roadmap Phase 1 / S4). Kept separate from `AuthUser` so the client
 * surface stays unchanged — nothing client-side needs the version.
 */
export interface SessionClaims extends AuthUser {
  tokenVersion: number;
}
