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
  }
  return _db;
}
