/* eslint-disable */
/**
 * Delete load-test users seeded by seed-load-users.mjs (prefix match) and their
 * user_progress docs, via the Firestore REST API + a gcloud access token.
 *
 *   ACCESS_TOKEN=$(gcloud auth print-access-token) COUNT=20 \
 *     node scripts/load/cleanup-load-users.mjs
 *
 * Idempotent: 404s on already-deleted docs are ignored. rate_limits / account_lockouts
 * docs are keyed by hash and auto-prune via their TTL policies, so they need no cleanup.
 */
const PROJECT = process.env.GCLOUD_PROJECT || "kids-learing-hub";
const TOKEN = process.env.ACCESS_TOKEN;
const COUNT = Number(process.env.COUNT || 20);
const PREFIX = process.env.PREFIX || "kmload";

if (!TOKEN) {
  console.error("ACCESS_TOKEN env required (gcloud auth print-access-token)");
  process.exit(1);
}

const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function del(path) {
  const res = await fetch(`${base}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  // 200 = deleted, 404 = already gone — both fine.
  if (!res.ok && res.status !== 404) {
    console.error(`delete ${path} failed: ${res.status} ${await res.text()}`);
  }
}

let removed = 0;
for (let i = 1; i <= COUNT; i++) {
  const id = `${PREFIX}${i}`;
  await del(`users/${id}`);
  await del(`user_progress/${id}`);
  removed++;
}
console.error(`cleanup done: removed up to ${removed} load-test users + progress docs (prefix "${PREFIX}")`);
