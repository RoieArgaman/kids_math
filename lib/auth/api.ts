import type { AuthUser } from "./types";

/**
 * Structured login outcome. The kinds let the UI speak to a child appropriately (roadmap
 * Phase 1 PM review): `locked` drives a calm countdown, `invalid` a warm "let's try again"
 * (with a "one more try" nudge when only one attempt remains), and network/error stay generic.
 */
export type LoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; kind: "invalid"; attemptsRemaining?: number }
  | { ok: false; kind: "locked"; retryAfterSeconds: number }
  | { ok: false; kind: "network" }
  | { ok: false; kind: "error" };

export async function apiLogin(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = (await res.json()) as { user: AuthUser };
      return { ok: true, user: data.user };
    }
    if (res.status === 429) {
      const data = (await res.json().catch(() => ({}))) as { retryAfterSeconds?: number };
      return { ok: false, kind: "locked", retryAfterSeconds: Number(data?.retryAfterSeconds) || 60 };
    }
    if (res.status === 401) {
      const data = (await res.json().catch(() => ({}))) as { attemptsRemaining?: number };
      return {
        ok: false,
        kind: "invalid",
        attemptsRemaining:
          typeof data?.attemptsRemaining === "number" ? data.attemptsRemaining : undefined,
      };
    }
    return { ok: false, kind: "error" };
  } catch {
    return { ok: false, kind: "network" };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore — cookie will expire naturally
  }
}

/** "Log out everywhere": revokes every session for this user (bumps tokenVersion) + signs out here. */
export async function apiLogoutAll(): Promise<void> {
  try {
    await fetch("/api/auth/logout-all", { method: "POST" });
  } catch {
    // ignore — cookie will expire naturally
  }
}

/**
 * `unauthorized` and `error` must stay distinct: the caller tears down local learner data on a
 * revoked session, and collapsing them would wipe a logged-in child's work on a network blip.
 */
export type MeResult =
  | { status: "ok"; user: AuthUser }
  | { status: "unauthorized" }
  | { status: "error" };

export async function apiMeResult(): Promise<MeResult> {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) return { status: "ok", user: (await res.json()) as AuthUser };
    if (res.status === 401) return { status: "unauthorized" };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}
