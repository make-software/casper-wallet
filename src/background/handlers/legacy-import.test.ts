import { Runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import {
  selectVaultAccountsNames,
  selectVaultAccountsSecretKeysBase64
} from '@background/redux/vault/selectors';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

import { handleLegacyImport } from './legacy-import';

// `isTrustedUiSender` (imported by the handler) reads runtime.id / getURL.
jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

// The membership-oracle sources — mock so we control what the vault "contains".
jest.mock('@background/redux/vault/selectors', () => ({
  selectVaultAccountsSecretKeysBase64: jest.fn(),
  selectVaultAccountsNames: jest.fn()
}));
jest.mock('@background/redux/windowManagement/selectors', () => ({
  selectWindowId: jest.fn()
}));

const selectSecretKeysMock =
  selectVaultAccountsSecretKeysBase64 as jest.MockedFunction<
    typeof selectVaultAccountsSecretKeysBase64
  >;
const selectNamesMock = selectVaultAccountsNames as jest.MockedFunction<
  typeof selectVaultAccountsNames
>;
const selectWindowIdMock = selectWindowId as jest.MockedFunction<
  typeof selectWindowId
>;

const TRUSTED_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/import-account-with-file.html'
} as Runtime.MessageSender;

const UNTRUSTED_SENDER = {
  id: 'evil-ext',
  url: 'https://evil.example/page'
} as Runtime.MessageSender;

const store = {
  getState: () => ({})
} as unknown as MainStore;

beforeEach(() => {
  selectSecretKeysMock.mockReset().mockReturnValue([]);
  selectNamesMock.mockReset().mockReturnValue([]);
  selectWindowIdMock.mockReset().mockReturnValue(null);
});

describe('handleLegacyImport routing gate', () => {
  it('non-legacy action type → { handled: false } (falls through to next handler)', () => {
    const result = handleLegacyImport(
      { type: 'not-a-legacy-type' },
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: false });
    // no state was read
    expect(selectSecretKeysMock).not.toHaveBeenCalled();
  });

  it.each([
    'check-secret-key-exist',
    'check-account-name-is-taken',
    'get-window-id'
  ])(
    'untrusted sender on %s → { handled: true } with NO response (membership oracle closed)',
    type => {
      const result = handleLegacyImport({ type }, UNTRUSTED_SENDER, store);
      // handled:true drops the message with no data leaked back
      expect(result).toEqual({ handled: true });
      expect(result).not.toHaveProperty('response');
      // and the vault was never queried for an untrusted caller
      expect(selectSecretKeysMock).not.toHaveBeenCalled();
      expect(selectNamesMock).not.toHaveBeenCalled();
      expect(selectWindowIdMock).not.toHaveBeenCalled();
    }
  );
});

describe('check-secret-key-exist (trusted)', () => {
  it('returns true when the secret key is present in the vault', () => {
    selectSecretKeysMock.mockReturnValue(['aaa', 'bbb']);
    const result = handleLegacyImport(
      {
        type: 'check-secret-key-exist',
        payload: { secretKeyBase64: 'bbb' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: true });
  });

  it('returns false when the secret key is absent', () => {
    selectSecretKeysMock.mockReturnValue(['aaa']);
    const result = handleLegacyImport(
      {
        type: 'check-secret-key-exist',
        payload: { secretKeyBase64: 'zzz' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: false });
  });

  it('returns false (short-circuit) when the payload key is empty — no membership probe', () => {
    const result = handleLegacyImport(
      {
        type: 'check-secret-key-exist',
        payload: { secretKeyBase64: '' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: false });
  });
});

describe('check-account-name-is-taken (trusted)', () => {
  it('returns true when the account name exists', () => {
    selectNamesMock.mockReturnValue(['Account 1', 'Savings']);
    const result = handleLegacyImport(
      {
        type: 'check-account-name-is-taken',
        payload: { accountName: 'Savings' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: true });
  });

  it('returns false when the account name is free', () => {
    selectNamesMock.mockReturnValue(['Account 1']);
    const result = handleLegacyImport(
      {
        type: 'check-account-name-is-taken',
        payload: { accountName: 'New' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: false });
  });

  it('returns false (short-circuit) when the payload name is empty', () => {
    const result = handleLegacyImport(
      {
        type: 'check-account-name-is-taken',
        payload: { accountName: '' }
      } as any,
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: false });
  });
});

describe('get-window-id (trusted)', () => {
  it('returns the current window id from state', () => {
    selectWindowIdMock.mockReturnValue(42);
    const result = handleLegacyImport(
      { type: 'get-window-id' },
      TRUSTED_SENDER,
      store
    );
    expect(result).toEqual({ handled: true, response: 42 });
  });
});
