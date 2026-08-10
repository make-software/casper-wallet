import {
  accountInfoReset,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} from './actions';
import { reducer } from './reducer';

const initial = {
  pendingDeployHashes: [],
  accountTrackingIdOfSentNftTokens: {}
};

describe('account-info reducer', () => {
  it('has correct initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initial);
  });
  it('prepends pending deploy hashes', () => {
    const s = reducer(
      { ...initial, pendingDeployHashes: ['0xB'] },
      accountPendingDeployHashesChanged('0xA')
    );
    expect(s.pendingDeployHashes).toEqual(['0xA', '0xB']);
  });
  it('removes pending hashes case-insensitively', () => {
    const s = reducer(
      { ...initial, pendingDeployHashes: ['0xAbC', '0xD'] },
      accountPendingDeployHashesRemove('0xabc')
    );
    expect(s.pendingDeployHashes).toEqual(['0xD']);
  });
  it('adds and removes nft tracking ids', () => {
    const s1 = reducer(
      initial,
      accountTrackingIdOfSentNftTokensChanged({
        trackingId: 't1',
        deployHash: 'd1'
      })
    );
    expect(s1.accountTrackingIdOfSentNftTokens).toEqual({ t1: 'd1' });
    const s2 = reducer(s1, accountTrackingIdOfSentNftTokensRemoved('t1'));
    expect(s2.accountTrackingIdOfSentNftTokens).toEqual({});
  });
  it('resets', () => {
    expect(
      reducer(
        {
          pendingDeployHashes: ['x'],
          accountTrackingIdOfSentNftTokens: { a: 'b' }
        },
        accountInfoReset()
      )
    ).toEqual(initial);
  });
});
