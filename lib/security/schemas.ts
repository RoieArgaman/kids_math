import { z } from "zod";

/**
 * Firestore document id. Must exclude "/" — a slashed value is a valid *path* to a nested doc,
 * which both escapes the `users` collection and defeats the `userId === admin.userId` self-guards
 * by string inequality.
 */
export const userIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

/**
 * Central request-body schemas (roadmap Phase 1 / S8).
 *
 * Replaces the hand-rolled `typeof` guards scattered across the route handlers with one
 * auditable module. Each schema preserves the EXACT contract of the guard it replaces —
 * same fields, same rejection points — so status codes and behavior are unchanged.
 *
 * IMPORTANT (backward-compat): the progress bundle is validated at the ENVELOPE level only
 * (`bundleVersion` ∈ {1..4}). We deliberately do NOT deep-validate the bundle: it holds years
 * of accumulated, deeply-nested learner data across bundleVersions, and a strict schema would
 * risk rejecting real stored bundles — a violation of the sacred backward-compat rule. The
 * merge layer (`clampFutureTimestamps`/`mergeBundles`) remains the tolerant reader.
 */

/** POST /api/auth/login */
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/** POST /api/admin/users — create. `overridePolicy` lets an admin set a simple/PIN password. */
export const adminCreateSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.string().optional(),
  overridePolicy: z.boolean().optional(),
});

/**
 * PATCH /api/admin/users — either a password reset or an "unlock" action.
 * Discriminated on `action` so an unlock request needs no password and a reset needs one.
 */
export const adminPatchSchema = z.union([
  z.object({
    userId: userIdSchema,
    action: z.enum(["unlock", "deactivate", "restore"]),
  }),
  z.object({
    userId: userIdSchema,
    password: z.string(),
    overridePolicy: z.boolean().optional(),
  }),
]);

/** DELETE /api/admin/users */
export const adminDeleteSchema = z.object({
  userId: userIdSchema,
});

/**
 * Body for the subject-aware grade-unlock/lock routes. Mirrors `lib/subjects.ts` `Subject`.
 * Preprocess trims + lowercases to preserve the EXACT tolerance of the `parseSubjectId` guard
 * this replaced — a cached client that sends `"Math"` or `" math "` must keep working
 * (backward-compat is sacred; these routes are also anonymous-reachable).
 */
export const subjectSchema = z.object({
  subject: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.enum(["math", "english", "science"]),
  ),
});

/**
 * Envelope-only progress schema. Accepts v1 (math), v2 (+English), v3 (+per-track review),
 * v4 (+Science) — backward + forward compatible. `passthrough` keeps every other field so the
 * merge layer sees the full bundle untouched.
 */
export const progressEnvelopeSchema = z
  .object({
    bundleVersion: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  })
  .passthrough();

export type LoginInput = z.infer<typeof loginSchema>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminPatchInput = z.infer<typeof adminPatchSchema>;
export type AdminDeleteInput = z.infer<typeof adminDeleteSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
