/**
 * Create a user in Firestore.
 * Usage: node --env-file=.env.local scripts/create-user.mjs --username <name> --password <pass> [--admin]
 *
 * Requires .env.local with FIRESTORE_CREDENTIALS_JSON set.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--username" && argv[i + 1]) args.username = argv[++i];
    else if (argv[i] === "--password" && argv[i + 1]) args.password = argv[++i];
    else if (argv[i] === "--admin") args.admin = true;
  }
  return args;
}

function initFirebase() {
  if (getApps().length > 0) return;
  const raw = process.env.FIRESTORE_CREDENTIALS_JSON;
  if (!raw) {
    console.error("❌  FIRESTORE_CREDENTIALS_JSON is not set in .env.local");
    process.exit(1);
  }
  try {
    const credentials = JSON.parse(raw);
    initializeApp({ credential: cert(credentials) });
  } catch {
    console.error("❌  Failed to parse FIRESTORE_CREDENTIALS_JSON — check it is valid JSON");
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.username || !args.password) {
    console.error("Usage: node --env-file=.env.local scripts/create-user.mjs --username <name> --password <pass> [--admin]");
    process.exit(1);
  }

  initFirebase();
  const db = getFirestore();

  const username = args.username.trim();
  const role = args.admin ? "admin" : "user";

  // Check for existing username
  const existing = await db
    .collection("users")
    .where("usernameLower", "==", username.toLowerCase())
    .limit(1)
    .get();

  if (!existing.empty) {
    console.error(`❌  Username "${username}" already exists`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(args.password, BCRYPT_ROUNDS);

  const docRef = await db.collection("users").add({
    username,
    usernameLower: username.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  });

  console.log(`✅  User created successfully`);
  console.log(`   userId:   ${docRef.id}`);
  console.log(`   username: ${username}`);
  console.log(`   role:     ${role}`);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
