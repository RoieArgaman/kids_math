import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore as _getFirestore, type Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

function ensureApp(): void {
  if (getApps().length > 0) return;
  const raw = process.env.FIRESTORE_CREDENTIALS_JSON;
  if (raw) {
    // Local dev: explicit service account JSON
    const credentials = JSON.parse(raw) as ServiceAccount;
    initializeApp({ credential: cert(credentials) });
  } else {
    // Production (Firebase App Hosting): Application Default Credentials
    initializeApp();
  }
}

export function getFirestore(): Firestore {
  if (!_db) {
    ensureApp();
    _db = _getFirestore();
    // The Admin SDK throws on any `undefined` field value. Progress bundles arrive
    // over JSON (which drops `undefined`) but transforms like the sync merge can
    // reintroduce explicit `undefined` (e.g. an optional per-day `updatedAt`), which
    // would otherwise 500 every push. Drop those the way JSON does. Must be set once,
    // before the first read/write — safe here since this is the only accessor.
    _db.settings({ ignoreUndefinedProperties: true });
  }
  return _db;
}
