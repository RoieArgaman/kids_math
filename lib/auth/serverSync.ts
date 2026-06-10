type SyncCallback = () => void;

let _syncCallback: SyncCallback | null = null;
let _syncTimer: ReturnType<typeof setTimeout> | null = null;

export function registerSyncCallback(fn: SyncCallback): void {
  _syncCallback = fn;
}

export function unregisterSyncCallback(): void {
  _syncCallback = null;
  if (_syncTimer !== null) {
    clearTimeout(_syncTimer);
    _syncTimer = null;
  }
}

/** Debounced sync trigger — no-op if no callback registered (i.e. user not logged in). */
export function scheduleSync(): void {
  if (!_syncCallback || typeof window === "undefined") return;
  if (_syncTimer !== null) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    _syncTimer = null;
    _syncCallback?.();
  }, 2000);
}
