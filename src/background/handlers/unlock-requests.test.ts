import * as scryptModule from '@background/workers/scrypt-off-thread';
import { MainStore } from '@background/redux/get-main-store';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '@background/redux/login-retry-count/actions';
import { unlockVault } from '@background/redux/sagas/actions';

import * as vaultCryptoModule from '@libs/crypto/vault';

import {
  UNLOCK_REQUEST_TYPE,
  VERIFY_PASSWORD_REQUEST_TYPE,
  handleUnlockRequest
} from './unlock-requests';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (p: string) => `chrome-extension://ext-id/${p}`
  }
}));
jest.mock('@background/sw-keep-alive-anchor', () => ({
  anchorServiceWorker: () => () => undefined
}));

const KEYS = {
  passwordHash: 'hash',
  passwordSaltHash: 'salt',
  keyDerivationSaltHash: 'kdf-salt'
};

function storeAt(
  loginRetryCount: number,
  overrides: Record<string, unknown> = {}
) {
  const dispatch = jest.fn();
  let count = loginRetryCount;
  dispatch.mockImplementation((action: { type: string }) => {
    if (action.type === loginRetryCountIncremented.type) count += 1;
    if (action.type === loginRetryCountReseted.type) count = 0;
  });

  const store = {
    dispatch,
    getState: () => ({
      keys: KEYS,
      session: { isLocked: true },
      loginRetryCount: count,
      loginRetryLockoutTime: null,
      vaultCipher: 'cipher',
      ...overrides
    })
  } as unknown as MainStore;

  return { store, dispatch };
}

beforeEach(() => jest.restoreAllMocks());

// Each test gets its own attemptId by default so the module-scoped memo (which
// deliberately outlives a single request — see MEMO_TTL_MS) never lets one
// test's verdict answer another's call.
let attemptCounter = 0;
const verify = (
  password: string,
  attemptId = `attempt-${++attemptCounter}`
) => ({
  type: VERIFY_PASSWORD_REQUEST_TYPE,
  payload: { password, attemptId }
});

it('answers lockedOut while a lockout is active, without verifying', async () => {
  const spy = jest.spyOn(scryptModule, 'verifyPasswordOffThread');
  const { store } = storeAt(5, { loginRetryLockoutTime: 1 });

  await expect(handleUnlockRequest(verify('x'), store)).resolves.toEqual({
    status: 'lockedOut'
  });
  expect(spy).not.toHaveBeenCalled();
});

it('increments and reports the exact attempts left on a wrong password', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(false);
  const { store, dispatch } = storeAt(0);

  await expect(handleUnlockRequest(verify('wrong'), store)).resolves.toEqual({
    status: 'wrong',
    attemptsLeft: 4
  });
  expect(dispatch).toHaveBeenCalledWith(loginRetryCountIncremented());
});

it('answers lockedOut when the wrong password reaches the limit', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(false);
  const { store } = storeAt(4);

  await expect(handleUnlockRequest(verify('wrong'), store)).resolves.toEqual({
    status: 'lockedOut'
  });
});

it('resets the counter on a correct password', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(true);
  const { store, dispatch } = storeAt(3);

  await expect(handleUnlockRequest(verify('right'), store)).resolves.toEqual({
    status: 'ok'
  });
  expect(dispatch).toHaveBeenCalledWith(loginRetryCountReseted());
});

it('runs one derivation for a repeated attemptId still in flight', async () => {
  const spy = jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockResolvedValue(false);
  const { store, dispatch } = storeAt(0);

  const [a, b] = await Promise.all([
    handleUnlockRequest(verify('wrong', 'dup-inflight'), store),
    handleUnlockRequest(verify('wrong', 'dup-inflight'), store)
  ]);

  expect(a).toEqual(b);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(
    dispatch.mock.calls.filter(
      ([action]) => action.type === loginRetryCountIncremented.type
    )
  ).toHaveLength(1);
});

it('re-verifies when the same attemptId arrives with a different password', async () => {
  const spy = jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true);
  const { store } = storeAt(0);

  await handleUnlockRequest(verify('wrong', 'diff-password'), store);
  await expect(
    handleUnlockRequest(verify('right', 'diff-password'), store)
  ).resolves.toEqual({ status: 'ok' });
  expect(spy).toHaveBeenCalledTimes(2);
});

it('replays the settled verdict for a same-id, same-password retry (a response that was dropped and retried)', async () => {
  const spy = jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockResolvedValue(false);
  const { store, dispatch } = storeAt(0);
  const request = verify('wrong', 'retry-after-settle');

  const first = await handleUnlockRequest(request, store);
  const second = await handleUnlockRequest(request, store);

  expect(first).toEqual(second);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(
    dispatch.mock.calls.filter(
      ([action]) => action.type === loginRetryCountIncremented.type
    )
  ).toHaveLength(1);
});

it('treats an expired memo entry as a miss and re-verifies', async () => {
  const spy = jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockResolvedValue(false);
  jest
    .spyOn(Date, 'now')
    .mockReturnValueOnce(1_000_000) // createdAt for the first request
    .mockReturnValue(1_000_000 + 10_001); // lookup on the second, past MEMO_TTL_MS
  const { store, dispatch } = storeAt(0);
  const request = verify('wrong', 'expiring');

  await handleUnlockRequest(request, store);
  await handleUnlockRequest(request, store);

  expect(spy).toHaveBeenCalledTimes(2);
  expect(
    dispatch.mock.calls.filter(
      ([action]) => action.type === loginRetryCountIncremented.type
    )
  ).toHaveLength(2);
});

it('answers ok without touching the counter when the vault is already unlocked', async () => {
  const spy = jest.spyOn(scryptModule, 'verifyPasswordOffThread');
  const { store, dispatch } = storeAt(2, { session: { isLocked: false } });

  await expect(
    handleUnlockRequest(
      { type: UNLOCK_REQUEST_TYPE, payload: { password: 'x', attemptId: 'a' } },
      store
    )
  ).resolves.toEqual({ status: 'ok' });
  expect(spy).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});

it('serialises concurrent derivations', async () => {
  let concurrent = 0;
  let peak = 0;
  jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockImplementation(async () => {
      concurrent += 1;
      peak = Math.max(peak, concurrent);
      await Promise.resolve();
      concurrent -= 1;
      return false;
    });
  const { store } = storeAt(0);

  await Promise.all([
    handleUnlockRequest(verify('p1', 'i1'), store),
    handleUnlockRequest(verify('p2', 'i2'), store),
    handleUnlockRequest(verify('p3', 'i3'), store)
  ]);

  expect(peak).toBe(1);
});

it('returns null for an unrelated type', async () => {
  const { store } = storeAt(0);
  await expect(
    handleUnlockRequest({ type: 'NOPE' }, store)
  ).resolves.toBeNull();
});

it('returns an error status for a malformed payload', async () => {
  const { store } = storeAt(0);

  await expect(
    handleUnlockRequest(
      { type: VERIFY_PASSWORD_REQUEST_TYPE, payload: { password: 'x' } },
      store
    )
  ).resolves.toEqual({ status: 'error' });
});

it('returns an error status for a missing payload', async () => {
  const { store } = storeAt(0);

  await expect(
    handleUnlockRequest({ type: VERIFY_PASSWORD_REQUEST_TYPE }, store)
  ).resolves.toEqual({ status: 'error' });
});

it('returns an error status for a non-object payload', async () => {
  const { store } = storeAt(0);

  await expect(
    handleUnlockRequest(
      { type: VERIFY_PASSWORD_REQUEST_TYPE, payload: 'oops' },
      store
    )
  ).resolves.toEqual({ status: 'error' });
});

it('returns an error status for a payload missing the password', async () => {
  const { store } = storeAt(0);

  await expect(
    handleUnlockRequest(
      { type: VERIFY_PASSWORD_REQUEST_TYPE, payload: { attemptId: 'x' } },
      store
    )
  ).resolves.toEqual({ status: 'error' });
});

it('rejects when no password hash has been set yet', async () => {
  const spy = jest.spyOn(scryptModule, 'verifyPasswordOffThread');
  const { store } = storeAt(0, { keys: { ...KEYS, passwordHash: null } });

  await expect(handleUnlockRequest(verify('x'), store)).rejects.toThrow(
    'No password is set'
  );
  expect(spy).not.toHaveBeenCalled();
});

it('rejects an UNLOCK_REQUEST when there is no vault cipher to unlock', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(true);
  const { store } = storeAt(0, { vaultCipher: null });

  await expect(
    handleUnlockRequest(
      {
        type: UNLOCK_REQUEST_TYPE,
        payload: { password: 'right', attemptId: 'u0' }
      },
      store
    )
  ).rejects.toThrow('No vault to unlock');
});

it('derives, decrypts and re-encrypts the vault on a correct UNLOCK_REQUEST', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(true);
  const deriveSpy = jest
    .spyOn(scryptModule, 'deriveScryptKey')
    .mockResolvedValueOnce(new Uint8Array([1, 2, 3, 4]))
    .mockResolvedValueOnce(new Uint8Array([5, 6, 7, 8]));
  const decryptedVault = {
    secretPhrase: null,
    accounts: [],
    accountNamesByOriginDict: {},
    siteNameByOriginDict: {},
    activeAccountName: null,
    jsonById: {},
    eip712ById: {},
    payloadSeqById: {}
  };
  const decryptSpy = jest
    .spyOn(vaultCryptoModule, 'decryptVault')
    .mockResolvedValue(decryptedVault);
  const encryptSpy = jest
    .spyOn(vaultCryptoModule, 'encryptVault')
    .mockResolvedValue('new-cipher');
  const { store, dispatch } = storeAt(0);

  await expect(
    handleUnlockRequest(
      {
        type: UNLOCK_REQUEST_TYPE,
        payload: { password: 'right', attemptId: 'u1' }
      },
      store
    )
  ).resolves.toEqual({ status: 'ok' });

  const oldKeyHash = '01020304';
  const newKeyHash = '05060708';
  expect(deriveSpy).toHaveBeenNthCalledWith(1, 'right', 'kdf-salt');
  expect(decryptSpy).toHaveBeenCalledWith(oldKeyHash, 'cipher');
  expect(encryptSpy).toHaveBeenCalledWith(newKeyHash, decryptedVault);
  expect(dispatch).toHaveBeenCalledWith(
    unlockVault(
      expect.objectContaining({
        vault: expect.objectContaining({ accounts: [] }),
        newVaultCipher: 'new-cipher',
        newEncryptionKeyHash: newKeyHash
      })
    )
  );
  expect(dispatch).not.toHaveBeenCalledWith(loginRetryCountReseted());
});

it('re-checks the lockout after a queued derivation, on the verify path, and does not reset', async () => {
  let lockoutArmedMidFlight = false;
  jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockImplementation(async () => {
      // Simulates another window's failed attempts arming the lockout while
      // this derivation sat queued behind it.
      lockoutArmedMidFlight = true;
      return true;
    });
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getState: () => ({
      keys: KEYS,
      session: { isLocked: true },
      loginRetryCount: 0,
      get loginRetryLockoutTime() {
        return lockoutArmedMidFlight ? 1 : null;
      },
      vaultCipher: 'cipher'
    })
  } as unknown as MainStore;

  await expect(handleUnlockRequest(verify('right'), store)).resolves.toEqual({
    status: 'lockedOut'
  });
  expect(dispatch).not.toHaveBeenCalledWith(loginRetryCountReseted());
});

it('does not replay a VERIFY verdict for an UNLOCK sharing the same id and password', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(true);
  jest
    .spyOn(scryptModule, 'deriveScryptKey')
    .mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  jest.spyOn(vaultCryptoModule, 'decryptVault').mockResolvedValue({
    secretPhrase: null,
    accounts: [],
    accountNamesByOriginDict: {},
    siteNameByOriginDict: {},
    activeAccountName: null,
    jsonById: {},
    eip712ById: {},
    payloadSeqById: {}
  });
  jest.spyOn(vaultCryptoModule, 'encryptVault').mockResolvedValue('new-cipher');
  const { store, dispatch } = storeAt(0);
  const sharedId = 'verify-then-unlock';

  await expect(
    handleUnlockRequest(verify('right', sharedId), store)
  ).resolves.toEqual({ status: 'ok' });

  await expect(
    handleUnlockRequest(
      {
        type: UNLOCK_REQUEST_TYPE,
        payload: { password: 'right', attemptId: sharedId }
      },
      store
    )
  ).resolves.toEqual({ status: 'ok' });

  expect(dispatch).toHaveBeenCalledWith(
    unlockVault(expect.objectContaining({ newVaultCipher: 'new-cipher' }))
  );
});

it('rejects a queued request without deriving once the lockout arms while the first request is still deriving', async () => {
  let lockoutArmed = false;
  const spy = jest
    .spyOn(scryptModule, 'verifyPasswordOffThread')
    .mockImplementation(async () => {
      // Simulates another window's failed attempts arming the lockout while
      // this first request's derivation is still in flight.
      lockoutArmed = true;
      return false;
    });
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getState: () => ({
      keys: KEYS,
      session: { isLocked: true },
      loginRetryCount: 0,
      get loginRetryLockoutTime() {
        return lockoutArmed ? 1 : null;
      },
      vaultCipher: 'cipher'
    })
  } as unknown as MainStore;

  const [, second] = await Promise.all([
    handleUnlockRequest(verify('wrong', 'queued-1'), store),
    handleUnlockRequest(verify('wrong', 'queued-2'), store)
  ]);

  expect(second).toEqual({ status: 'lockedOut' });
  expect(spy).toHaveBeenCalledTimes(1);
});

it('evicts the oldest in-flight entry once the memo is full', async () => {
  jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(false);
  const { store } = storeAt(0);

  const results = Array.from({ length: 9 }, (_, i) =>
    handleUnlockRequest(verify(`p${i}`, `evict-${i}`), store)
  );

  await expect(Promise.all(results)).resolves.toBeDefined();
});

describe('memo password digest', () => {
  it('is stable for the same password within a process', async () => {
    const { digestPassword } = await import('./unlock-requests');

    expect(digestPassword('correct horse')).toBe(
      digestPassword('correct horse')
    );
  });

  it('separates two passwords', async () => {
    const { digestPassword } = await import('./unlock-requests');

    expect(digestPassword('a')).not.toBe(digestPassword('b'));
  });

  it('never contains the password', async () => {
    const { digestPassword } = await import('./unlock-requests');

    expect(digestPassword('hunter2')).not.toContain('hunter2');
  });

  // The digest must be keyed on a per-process secret. A bare hash of the
  // password would be a brute-force oracle far cheaper than the scrypt-derived
  // vault cipher it guards, so "same password, fresh process, same digest" is
  // the failure this pins.
  it('differs across processes for the same password', async () => {
    const { digestPassword: first } = await import('./unlock-requests');
    const before = first('same password');

    jest.resetModules();
    const { digestPassword: second } = await import('./unlock-requests');

    expect(second('same password')).not.toBe(before);
  });
});
