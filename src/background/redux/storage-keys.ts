// Absolute-timestamp deadlines (`Date.now() + remaining`, in ms) written
// directly to `storage.local` by the vault sagas so the login-retry lockout and
// the auto-lock inactivity timers survive MV3 service-worker restarts. These are
// NOT part of the Redux state shape — they are standalone storage entries the
// sagas read on `startBackground` to resume the residual delay.
//
// They live here, apart from get-main-store, precisely so a consumer (or a test)
// can read the real values without importing the Redux store.
//
// IMPORTANT: once shipped, these key strings are immutable. Existing installs
// persist deadlines under exactly these strings; renaming them would strand the
// old entries and break resume-after-restart for already-locked-out users.
// See docs/architecture/storage-keys.md for the full key inventory.
export const LOGIN_RETRY_LOCKOUT_DEADLINE_KEY = 'q9Tf3Lm4pRxVne';
export const AUTO_LOCK_DEADLINE_KEY = 'r3Wj7Nc8vBhQyD';
