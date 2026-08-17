import { Runtime, runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';

import { deriveKeyPair } from '@libs/crypto';
import { FIXED_SECRET_PHRASE } from '@libs/crypto/__fixtures';

import {
  SECRET_PHRASE_REQUEST_TYPE,
  SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE,
  fetchSecretPhrase,
  fetchSuggestedAccountName,
  handleVaultSecrets
} from './vault-secrets';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`,
    sendMessage: jest.fn()
  }
}));

const POPUP_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html#/backup-secret-phrase'
} as Runtime.MessageSender;

const CONNECT_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/connect-to-app.html'
} as Runtime.MessageSender;

const PAGE_SENDER = {
  id: 'ext-id',
  url: 'https://evil.example/index.html'
} as Runtime.MessageSender;

// Same id and an allow-listed pathname — only isTrustedUiSender's origin
// check can reject this one, so it pins down that leg of the `||` guard.
const SPOOFED_ORIGIN_SENDER = {
  id: 'ext-id',
  url: 'https://evil.example/popup.html'
} as Runtime.MessageSender;

const NO_URL_SENDER = {
  id: 'ext-id',
  url: undefined
} as Runtime.MessageSender;

const storeWith = (state: unknown) =>
  ({ getState: () => state }) as unknown as MainStore;

const unlocked = {
  session: { isLocked: false },
  vault: { secretPhrase: ['w1', 'w2'], accounts: [] }
};

describe('handleVaultSecrets — SECRET_PHRASE_REQUEST', () => {
  it('returns the phrase to the popup page', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        POPUP_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: ['w1', 'w2'] });
  });

  it('refuses a page that has no business holding the phrase', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        CONNECT_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: null });
  });

  it('refuses a web page sender', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        PAGE_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: null });
  });

  it('refuses a same-id sender whose URL is not under the extension origin', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        SPOOFED_ORIGIN_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: null });
  });

  it('refuses a sender with no URL', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        NO_URL_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: null });
  });

  it('refuses while the vault is locked', () => {
    expect(
      handleVaultSecrets(
        { type: SECRET_PHRASE_REQUEST_TYPE },
        POPUP_SENDER,
        storeWith({ ...unlocked, session: { isLocked: true } })
      )
    ).toEqual({ handled: true, response: null });
  });

  it('passes unrelated actions through', () => {
    expect(
      handleVaultSecrets(
        { type: 'SOME_REDUX_ACTION' },
        POPUP_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: false });
  });
});

describe('handleVaultSecrets — SUGGESTED_ACCOUNT_NAME_REQUEST', () => {
  it('suggests "Account 1" for an empty vault', () => {
    expect(
      handleVaultSecrets(
        { type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE },
        POPUP_SENDER,
        storeWith({
          session: { isLocked: false },
          vault: { secretPhrase: FIXED_SECRET_PHRASE, accounts: [] }
        })
      )
    ).toEqual({ handled: true, response: 'Account 1' });
  });

  it('skips a name already taken by an imported account', () => {
    // imported: true keeps selectVaultDerivedAccounts empty, so the derived
    // index stays 0 and only the name-collision loop is exercised.
    expect(
      handleVaultSecrets(
        { type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE },
        POPUP_SENDER,
        storeWith({
          session: { isLocked: false },
          vault: {
            secretPhrase: FIXED_SECRET_PHRASE,
            accounts: [
              {
                name: 'Account 1',
                imported: true,
                publicKey: 'imported-key',
                secretKey: '',
                hidden: false
              }
            ]
          }
        })
      )
    ).toEqual({ handled: true, response: 'Account 2' });
  });

  it('refuses a page that has no business suggesting names', () => {
    expect(
      handleVaultSecrets(
        { type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE },
        CONNECT_SENDER,
        storeWith(unlocked)
      )
    ).toEqual({ handled: true, response: null });
  });

  it('ignores an imported account even when its public key matches a derived index', () => {
    // The account IS index 0's key pair, but imported: true — only a handler
    // wired to selectVaultDerivedAccounts (not selectVaultAccounts) sees index
    // 0 as free and answers 'Account 1'; a wrong selector would answer 'Account 2'.
    const derivedAccount0 = deriveKeyPair(FIXED_SECRET_PHRASE, 0);

    expect(
      handleVaultSecrets(
        { type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE },
        POPUP_SENDER,
        storeWith({
          session: { isLocked: false },
          vault: {
            secretPhrase: FIXED_SECRET_PHRASE,
            accounts: [
              {
                ...derivedAccount0,
                name: 'Imported',
                imported: true,
                hidden: false
              }
            ]
          }
        })
      )
    ).toEqual({ handled: true, response: 'Account 1' });
  });
});

// The client fns live in this file, which is under the handlers coverage floor
// (functions 100%) — same reason private-state.test.ts covers fetchPrivateState.
describe('fetchSecretPhrase', () => {
  it('asks the background for the phrase', async () => {
    (runtime.sendMessage as jest.Mock).mockResolvedValue(['w1']);

    await expect(fetchSecretPhrase()).resolves.toEqual(['w1']);
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: SECRET_PHRASE_REQUEST_TYPE
    });
  });
});

describe('fetchSuggestedAccountName', () => {
  it('asks the background for the suggested name', async () => {
    (runtime.sendMessage as jest.Mock).mockResolvedValue('Account 2');

    await expect(fetchSuggestedAccountName()).resolves.toEqual('Account 2');
    expect(runtime.sendMessage).toHaveBeenCalledWith({
      type: SUGGESTED_ACCOUNT_NAME_REQUEST_TYPE
    });
  });
});
