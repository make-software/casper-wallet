import { vaultUnlocked } from '../session/actions';
import { lastActivityTimeRefreshed } from './actions';
import { reducer } from './reducer';

describe('last-activity-time reducer', () => {
  it('has null initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toBeNull();
  });
  it('stores now() on lastActivityTimeRefreshed', () => {
    const before = Date.now();
    const next = reducer(null, lastActivityTimeRefreshed());
    expect(next).toBeGreaterThanOrEqual(before);
    expect(next).toBeLessThanOrEqual(Date.now());
  });
  it('stores now() on vaultUnlocked', () => {
    const before = Date.now();
    const next = reducer(null, vaultUnlocked());
    expect(next).toBeGreaterThanOrEqual(before);
    expect(next).toBeLessThanOrEqual(Date.now());
  });
});
