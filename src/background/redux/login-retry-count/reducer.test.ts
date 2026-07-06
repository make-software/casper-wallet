import { loginRetryCountIncremented, loginRetryCountReseted } from './actions';
import { reducer } from './reducer';

describe('login-retry-count reducer', () => {
  it('starts at 0', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBe(0);
  });
  it('increments', () => {
    expect(reducer(2, loginRetryCountIncremented())).toBe(3);
  });
  it('resets to 0', () => {
    expect(reducer(4, loginRetryCountReseted())).toBe(0);
  });
});
