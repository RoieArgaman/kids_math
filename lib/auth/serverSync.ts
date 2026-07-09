type SyncCallback = () => void;

let _syncCallback: SyncCallback | null = null;
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _suspended = false;

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

/**
 * Suspend debounced pushes. While suspended, `scheduleSync()` is a no-op and does
 * not arm the timer. Used during push-then-pull so a hydrate doesn't trigger a
 * stale re-push. Paired with `resumeSync()`.
 */
export function suspendSync(): void {
  _suspended = true;
}

export function resumeSync(): void {
  _suspended = false;
}

/** Synchronously fire a pending debounced push (if any) and clear the timer. */
export function flushSync(): void {
  if (_syncTimer !== null) {
    clearTimeout(_syncTimer);
    _syncTimer = null;
    _syncCallback?.();
  }
}

/** Debounced sync trigger — no-op if no callback registered (i.e. user not logged in) or suspended. */
export function scheduleSync(): void {
  if (!_syncCallback || _suspended || typeof window === "undefined") return;
  if (_syncTimer !== null) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    _syncTimer = null;
    _syncCallback?.();
  }, 2000);
}
