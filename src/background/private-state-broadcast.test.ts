import { backgroundEvent } from '@background/background-events';
import { PrivateState } from '@background/handlers/private-state';

import { privateStateChanged } from './private-state-broadcast';

const basePrivateState: PrivateState = {
  passwordHash: 'password-hash',
  passwordSaltHash: 'password-salt-hash',
  keyDerivationSaltHash: 'key-derivation-salt-hash',
  vaultCipher: 'vault-cipher'
};

describe('privateStateChanged', () => {
  it('returns false for two identical selections', () => {
    expect(privateStateChanged(basePrivateState, { ...basePrivateState })).toBe(
      false
    );
  });

  it('returns true when passwordHash differs', () => {
    expect(
      privateStateChanged(basePrivateState, {
        ...basePrivateState,
        passwordHash: 'new-password-hash'
      })
    ).toBe(true);
  });

  it('returns true when passwordSaltHash differs', () => {
    expect(
      privateStateChanged(basePrivateState, {
        ...basePrivateState,
        passwordSaltHash: 'new-password-salt-hash'
      })
    ).toBe(true);
  });

  it('returns true when keyDerivationSaltHash differs', () => {
    expect(
      privateStateChanged(basePrivateState, {
        ...basePrivateState,
        keyDerivationSaltHash: 'new-key-derivation-salt-hash'
      })
    ).toBe(true);
  });

  it('returns true when vaultCipher differs', () => {
    expect(
      privateStateChanged(basePrivateState, {
        ...basePrivateState,
        vaultCipher: 'new-vault-cipher'
      })
    ).toBe(true);
  });

  it('returns true on a null-to-value transition', () => {
    const nullState: PrivateState = {
      passwordHash: null,
      passwordSaltHash: null,
      keyDerivationSaltHash: null,
      vaultCipher: null
    };

    expect(privateStateChanged(nullState, basePrivateState)).toBe(true);
  });
});

describe('backgroundEvent.privateStateUpdated', () => {
  it('is payload-free — carries no private material', () => {
    const action = backgroundEvent.privateStateUpdated();

    // toEqual treats an undefined-valued key as equal to a missing key, so
    // this also covers the `{ type: 'privateStateUpdated' }` shape.
    expect(action).toEqual({ type: 'privateStateUpdated' });
    // RTK's createAction() with no payload type still attaches a `payload`
    // key valued `undefined` at runtime (verified against this RTK version)
    // rather than omitting the key outright. The security property that
    // actually matters — no private material travels in the message — is
    // that the payload carries no value, which this asserts directly.
    expect(action.payload).toBeUndefined();
  });
});
