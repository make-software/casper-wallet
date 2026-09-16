import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';

// Renaming a key strands the persisted deadline, the only record of what was promised.
// Nothing else catches a rename: revert it, don't update the expectation.
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
