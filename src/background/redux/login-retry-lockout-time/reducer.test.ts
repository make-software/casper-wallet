import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from './actions';
import { reducer } from './reducer';

describe('login-retry-lockout-time reducer', () => {
  it('has null initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBeNull();
  });
  it('stores the lockout timestamp', () => {
    expect(reducer(null, loginRetryLockoutTimeSet(1234567890))).toBe(
      1234567890
    );
  });
  it('resets to null', () => {
    expect(reducer(1234567890, loginRetryLockoutTimeReseted())).toBeNull();
  });
});
