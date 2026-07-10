type SyncCallback = () => void;

let _syncCallback: SyncCallback | null = null;
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _suspended = false;

/**
 * Monotonic auth-identity epoch. Bumped on every login and logout so async
 * reconciles/syncs that were in flight across an identity change can detect the
 * change (capture at entry, compare before writing) and abort their `hydrate` /
 * `setUser` — this is what stops one student's in-flight pull from repainting the
 * next student's screen (shared computer) after a logout or user switch.
 */
let _authEpoch = 0;

/**
 * Whether local storage has been reconciled with the server for the CURRENT
 * identity (hydrated from the server, or the server confirmed the account empty).
 * Pushing local up before this is true would send fresh-`now`-stamped default
 * domains that win whole-domain LWW and clobber the user's real server data, so
 * every push site must gate on this.
 */
let _primed = false;

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

/** Current auth epoch. Capture at the start of an async reconcile/sync. */
export function getAuthEpoch(): number {
  return _authEpoch;
}

/** Bump the auth epoch. Call on every login and logout (identity boundary). */
export function bumpAuthEpoch(): number {
  _authEpoch += 1;
  return _authEpoch;
}

/**
 * Whether sync is live for a logged-in, reconciled identity — i.e. a push
 * callback is currently registered. Logout unregisters it synchronously, so this
 * is the reliable "we are logged in and may touch storage" signal that a stray
 * async pull (fired by a visibility/pageshow event during the logout network
 * round-trip) must check before hydrating, or it would repaint the just-cleared
 * device with the prior student's data.
 */
export function isSyncActive(): boolean {
  return _syncCallback !== null;
}

/** Whether local is reconciled with the server for the current identity. */
export function isSyncPrimed(): boolean {
  return _primed;
}

/** Arm/disarm pushes. `true` only after a confirmed server hydrate/empty. */
export function setSyncPrimed(primed: boolean): void {
  _primed = primed;
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
