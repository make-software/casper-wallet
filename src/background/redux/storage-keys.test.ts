import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';

// The module comment says these strings are immutable once shipped. Nothing
// else can observe that: `vault-sagas.test.ts` uses the constants symbolically
// on both sides of every assertion — the fixture key and the asserted key are
// the same symbol — so a rename ships fully green there. The literals otherwise
// live only in the module and in `docs/architecture/storage-keys.md`, with no
// doc/code parity check anywhere in `src`, `scripts` or CI.
//
// Renaming one strands the persisted entry. It does NOT reset the countdown:
// both resume paths fall back to the same formula they armed with
// (`vault-sagas.ts:234` recomputes `loginRetryLockoutTime + LOCK_VAULT_TIMEOUT`,
// which is `:224` verbatim; `:383` mirrors `:386`), and both operands are
// themselves persisted slices — so the residual delay usually survives. What
// does not survive is the case where the operand changed since arming:
// `LOCK_VAULT_TIMEOUT` bumped by an update, or the user editing the auto-lock
// timeout mid-countdown. The stored deadline is the only record of what was
// actually promised, plus an orphan key left in `storage.local` forever.
//
// These assertions are the only thing that can catch a rename, so DO NOT "fix"
// a failure here by updating the expected string — revert the rename instead.
describe('storage-keys — shipped values are immutable', () => {
  it('pins LOGIN_RETRY_LOCKOUT_DEADLINE_KEY', () => {
    expect(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY).toBe('q9Tf3Lm4pRxVne');
  });

  it('pins AUTO_LOCK_DEADLINE_KEY', () => {
    expect(AUTO_LOCK_DEADLINE_KEY).toBe('r3Wj7Nc8vBhQyD');
  });

  it('keeps the two keys distinct', () => {
    expect(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY).not.toBe(AUTO_LOCK_DEADLINE_KEY);
  });
});
