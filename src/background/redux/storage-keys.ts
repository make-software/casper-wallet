// Absolute-timestamp deadlines written straight to `storage.local`, so lockout and
// auto-lock survive worker restarts. Once shipped these key strings are immutable.
export const LOGIN_RETRY_LOCKOUT_DEADLINE_KEY = 'q9Tf3Lm4pRxVne';
export const AUTO_LOCK_DEADLINE_KEY = 'r3Wj7Nc8vBhQyD';
