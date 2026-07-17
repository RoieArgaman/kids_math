/* eslint-disable */
/**
 * Seed throwaway load-test users directly via the Firestore REST API using a gcloud
 * access token (no ADC / service account needed). Prints a USERS JSON array for k6 and
 * tags each doc with `loadTest: true` so cleanup-load-users.mjs can remove them.
 *
 *   ACCESS_TOKEN=$(gcloud auth print-access-token) COUNT=20 \
 *     node scripts/load/seed-load-users.mjs
 *
 * NEVER leave these users in a real DB — always run the cleanup after the test.
 */
import bcrypt from "bcryptjs";

const PROJECT = process.env.GCLOUD_PROJECT || "kids-learing-hub";
const TOKEN = process.env.ACCESS_TOKEN;
const COUNT = Number(process.env.COUNT || 20);
const PREFIX = process.env.PREFIX || "kmload";
const PASSWORD = process.env.LOAD_PASSWORD || "LoadTest2026x";

if (!TOKEN) {
  console.error("ACCESS_TOKEN env required (gcloud auth print-access-token)");
  process.exit(1);
}

const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const hash = bcrypt.hashSync(PASSWORD, 12);
const users = [];

for (let i = 1; i <= COUNT; i++) {
  const username = `${PREFIX}${i}`;
  const doc = {
    fields: {
      username: { stringValue: username },
      usernameLower: { stringValue: username.toLowerCase() },
      passwordHash: { stringValue: hash },
      role: { stringValue: "user" },
      tokenVersion: { integerValue: "0" },
      createdAt: { stringValue: new Date().toISOString() },
      loadTest: { booleanValue: true },
    },
  };
  const res = await fetch(`${base}/users?documentId=${username}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    console.error(`seed ${username} failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  users.push({ username, password: PASSWORD });
}

// Machine-readable USERS array on the last line (for k6 USERS env).
console.error(`seeded ${users.length} users with prefix "${PREFIX}"`);
console.log(JSON.stringify(users));
