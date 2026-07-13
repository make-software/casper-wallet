import { Runtime, runtime } from 'webextension-polyfill';

import { RootState } from '@background/redux/store-types';

import {
  PRIVATE_STATE_REQUEST_TYPE,
  fetchPrivateState,
  isPrivateStateRequest,
  isTrustedUiSender,
  selectPrivateState
} from './private-state';

// `webextension-polyfill` throws outside an extension. Stub the identity +
// origin surface the security gate reads, and the messaging channel the UI uses.
jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`,
    sendMessage: jest.fn()
  }
}));

const sendMessageMock = runtime.sendMessage as jest.MockedFunction<
  typeof runtime.sendMessage
>;

describe('isTrustedUiSender (private-state security gate)', () => {
  it('all three satisfied (id matches, url present + under extension origin) → true', () => {
    const sender = {
      id: 'ext-id',
      url: 'chrome-extension://ext-id/popup.html'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(true);
  });

  it('id mismatch → false (another extension impersonating)', () => {
    const sender = {
      id: 'other-ext',
      url: 'chrome-extension://ext-id/popup.html'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });

  it('url null → false (content-script / no page url)', () => {
    const sender = { id: 'ext-id', url: undefined } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });

  it('url not under getURL("") → false (web page on a spoofed origin)', () => {
    const sender = {
      id: 'ext-id',
      url: 'https://evil.example/chrome-extension://ext-id/'
    } as Runtime.MessageSender;

    expect(isTrustedUiSender(sender)).toBe(false);
  });
});

describe('isPrivateStateRequest', () => {
  it('matching type → true', () => {
    expect(isPrivateStateRequest({ type: PRIVATE_STATE_REQUEST_TYPE })).toBe(
      true
    );
  });

  it('mismatching type → false', () => {
    expect(isPrivateStateRequest({ type: 'SOMETHING_ELSE' })).toBe(false);
  });

  it('non-object (null / undefined) → false via optional chaining', () => {
    expect(isPrivateStateRequest(null)).toBe(false);
    expect(isPrivateStateRequest(undefined)).toBe(false);
  });
});

describe('selectPrivateState', () => {
  it('maps exactly the four at-rest secret fields off the root state', () => {
    const state = {
      keys: {
        passwordHash: 'pw',
        passwordSaltHash: 'pw-salt',
        keyDerivationSaltHash: 'kd-salt'
      },
      vaultCipher: 'cipher-blob'
    } as unknown as RootState;

    expect(selectPrivateState(state)).toEqual({
      passwordHash: 'pw',
      passwordSaltHash: 'pw-salt',
      keyDerivationSaltHash: 'kd-salt',
      vaultCipher: 'cipher-blob'
    });
  });

  it('propagates nulls when the vault is uninitialized', () => {
    const state = {
      keys: {
        passwordHash: null,
        passwordSaltHash: null,
        keyDerivationSaltHash: null
      },
      vaultCipher: null
    } as unknown as RootState;

    expect(selectPrivateState(state)).toEqual({
      passwordHash: null,
      passwordSaltHash: null,
      keyDerivationSaltHash: null,
      vaultCipher: null
    });
  });
});

describe('fetchPrivateState (UI side request)', () => {
  beforeEach(() => sendMessageMock.mockReset());

  it('sends exactly the private-state request-type message and returns its promise', async () => {
    const resolved = {
      passwordHash: 'pw',
      passwordSaltHash: 's',
      keyDerivationSaltHash: 'k',
      vaultCipher: 'c'
    };
    sendMessageMock.mockResolvedValue(resolved);

    const result = await fetchPrivateState();

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith({
      type: PRIVATE_STATE_REQUEST_TYPE
    });
    expect(result).toEqual(resolved);
  });
});
