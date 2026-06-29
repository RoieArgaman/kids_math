"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseStatusMessageOptions<T> {
  /** Initial / cleared value. */
  initial: T;
  /**
   * Auto-dismiss delay in ms. When set, every non-empty `setStatus` schedules a
   * reset back to `initial` after this delay. Omit for sticky messages.
   */
  autoDismissMs?: number;
  /** Treat a value as "empty" (no message) so auto-dismiss skips it. Defaults to `Boolean`. */
  isEmpty?: (value: T) => boolean;
}

/**
 * Success/error status-message state shared by admin screens.
 *
 * AdminProgressScreen uses a `{ kind, message } | null` status with no auto-dismiss;
 * AdminUsersScreen uses a string status with a 3000ms auto-dismiss. The hook is
 * generic over the status shape so both call sites keep their exact value and timing.
 */
export function useStatusMessage<T>({
  initial,
  autoDismissMs,
  isEmpty = (value) => !value,
}: UseStatusMessageOptions<T>): {
  status: T;
  setStatus: (next: T) => void;
  clear: () => void;
} {
  const [status, setStatusState] = useState<T>(initial);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setStatus = useCallback(
    (next: T) => {
      clearTimer();
      setStatusState(next);
      if (autoDismissMs !== undefined && !isEmpty(next)) {
        timeoutRef.current = setTimeout(() => {
          setStatusState(initialRef.current);
        }, autoDismissMs);
      }
    },
    [autoDismissMs, clearTimer, isEmpty],
  );

  const clear = useCallback(() => {
    clearTimer();
    setStatusState(initialRef.current);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { status, setStatus, clear };
}
