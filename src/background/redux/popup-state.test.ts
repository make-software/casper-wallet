import { selectPopupState } from '@background/redux/popup-state';
import rootReducer from '@background/redux/root-reducer';
import { RootState } from '@background/redux/store-types';

// A full, untouched RootState — every slice at its reducer's initial value.
const fullState = rootReducer(undefined, { type: '@@INIT' }) as RootState;

// Spelled out rather than imported from POPUP_SLICES: the module under test
// defines that list, so comparing against it can never catch a wrong broadcast.
const EXPECTED_POPUP_STATE_KEYS = [
  'accountInfo',
  'activeOrigin',
  'activeOriginFavicon',
  'appEvents',
  'contacts',
  'csprNameExpirations',
  'keys',
  'lastActivityTime',
  'ledger',
  'loginRetryCount',
  'loginRetryLockoutTime',
  'rateApp',
  'recentRecipientPublicKeys',
  'session',
  'settings',
  'trustedWasm',
  'vault',
  'windowManagement'
];

describe('selectPopupState', () => {
  it('broadcasts exactly the expected slices', () => {
    const payload = selectPopupState(fullState);

    expect(Object.keys(payload).sort()).toEqual(EXPECTED_POPUP_STATE_KEYS);
  });

  it('nulls the key material and narrows windowManagement to windowId', () => {
    const payload = selectPopupState({
      ...fullState,
      keys: {
        passwordHash: 'ph',
        passwordSaltHash: 'ps',
        keyDerivationSaltHash: 'kd',
        keysDoesExist: true
      },
      session: { ...fullState.session, encryptionKeyHash: 'ek' }
    });

    expect(payload.keys).toEqual({
      passwordHash: null,
      passwordSaltHash: null,
      keyDerivationSaltHash: null,
      keysDoesExist: true
    });
    expect(payload.session.encryptionKeyHash).toBeNull();
    // Exact keys, not just the nulled one: a spread-built override would ship
    // any newly added SessionState field without a compile error.
    expect(Object.keys(payload.session).sort()).toEqual([
      'encryptionKeyDoesExist',
      'encryptionKeyHash',
      'isContactEditingAllowed',
      'isLocked'
    ]);
    expect(Object.keys(payload.windowManagement)).toEqual(['windowId']);
  });

  it('does not broadcast payloadSeqById — no replica reads it', () => {
    const payload = selectPopupState(fullState);

    expect('payloadSeqById' in payload.vault).toBe(false);
  });
});
