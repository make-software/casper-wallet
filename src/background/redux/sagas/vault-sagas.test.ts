import * as matchers from 'redux-saga-test-plan/matchers';
import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { dynamic, throwError } from 'redux-saga-test-plan/providers';
import { put } from 'redux-saga/effects';
import { storage, tabs, windows } from 'webextension-polyfill';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue,
  TimeoutDurationSetting
} from '@popup/constants';

import * as scryptModule from '@background/workers/scrypt-off-thread';
import {
  dismissSagaErrorsBySource,
  sagaError
} from '@background/redux/app-events/actions';
import { loginRetryLockoutTimeReseted } from '@background/redux/login-retry-lockout-time/actions';
import {
  selectHasLoginRetryLockoutTime,
  selectLoginRetryLockoutTime
} from '@background/redux/login-retry-lockout-time/selectors';
import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';

import * as bip32Module from '@libs/crypto/bip32';
import * as hashingModule from '@libs/crypto/hashing';
import * as vaultCryptoModule from '@libs/crypto/vault';
import { FIXED_ENCRYPTION_KEY_HASH } from '@libs/crypto/__fixtures';
import { decryptVault, encryptVault } from '@libs/crypto/vault';
import { Account } from '@libs/types/account';

import { keysUpdated } from '../keys/actions';
import { reducer as keysReducer } from '../keys/reducer';
import { selectPasswordHash, selectPasswordSaltHash } from '../keys/selectors';
import { lastActivityTimeRefreshed } from '../last-activity-time/actions';
import { selectVaultLastActivityTime } from '../last-activity-time/selectors';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '../login-retry-count/actions';
import { selectLoginRetryCount } from '../login-retry-count/selectors';
import { loginRetryLockoutTimeSet } from '../login-retry-lockout-time/reducer';
import {
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';
import { reducer as sessionReducer } from '../session/reducer';
import {
  selectEncryptionKeyHash,
  selectVaultIsLocked
} from '../session/selectors';
import { selectTimeoutDurationSetting } from '../settings/selectors';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { reducer as vaultCipherReducer } from '../vault-cipher/reducer';
import { selectVaultCipherDoesExist } from '../vault-cipher/selectors';
import {
  accountAdded,
  accountImported,
  accountRenamed,
  accountsAdded,
  accountsImported,
  deployPayloadReceived,
  vaultLoaded
} from '../vault/actions';
import { MAX_STORED_PAYLOADS, reducer as vaultReducer } from '../vault/reducer';
import {
  selectAccountNamesByOriginDict,
  selectSecretPhrase,
  selectVault,
  selectVaultActiveAccount,
  selectVaultDerivedAccounts
} from '../vault/selectors';
import { VaultState } from '../vault/types';
import { windowRequestResponded } from '../windowManagement/actions';
import { reducer as windowManagementReducer } from '../windowManagement/reducer';
import { selectOpenRequests } from '../windowManagement/selectors';
import { WindowManagementState } from '../windowManagement/types';
import {
  changePassword,
  createAccount,
  lockVault,
  startBackground,
  unlockVault
} from './actions';
import { errorToMessage } from './utils';
import {
  VAULT_REENCRYPT_DEBOUNCE_MS,
  armLockoutSaga,
  changePasswordSaga,
  delay,
  lockVaultSaga,
  reconcileStalePayloadsSaga,
  setDelayForLockoutVaultSaga,
  timeoutCounterSaga,
  unlockVaultSaga,
  vaultSagas
} from './vault-sagas';

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined)
    }
  },
  runtime: {
    sendMessage: jest.fn().mockResolvedValue(undefined),
    getURL: jest.fn(() => 'chrome-extension://abcdefghijklmnop/')
  },
  tabs: { query: jest.fn().mockResolvedValue([]), sendMessage: jest.fn() },
  windows: { getAll: jest.fn().mockResolvedValue([]) }
}));

const mockStorageGet = storage.local.get as jest.Mock;
const mockStorageSet = storage.local.set as jest.Mock;
const mockStorageRemove = storage.local.remove as jest.Mock;
const mockTabsQuery = tabs.query as jest.Mock;
const mockWindowsGetAll = windows.getAll as jest.Mock;

const NOW = 1_700_000_000_000;
const FIVE_SECONDS = 5000;

// A shape-complete empty vault. The re-encrypt path never reads its contents in
// these tests (encryptVault is always stubbed/spied), so empty fields suffice —
// this just gives the `selectVault` provides an honest VaultState type.
const EMPTY_VAULT: VaultState = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {},
  eip712ById: {},
  payloadSeqById: {}
};

// Instantly resolve the module's own delay helper so tests never wait on a real
// timer, and so the `.call(delay, ms)` assertion can verify the exact residual.
const instantDelay: [ReturnType<typeof matchers.call.fn>, undefined] = [
  matchers.call.fn(delay),
  undefined
];

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  mockStorageGet.mockReset().mockResolvedValue({});
  mockStorageSet.mockReset().mockResolvedValue(undefined);
  mockStorageRemove.mockReset().mockResolvedValue(undefined);
  mockTabsQuery.mockClear();
  mockWindowsGetAll.mockReset().mockResolvedValue([]);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('setDelayForLockoutVaultSaga', () => {
  it('resumes on startBackground with a future deadline: waits the residual, not the full duration', async () => {
    const deadline = NOW + FIVE_SECONDS;
    mockStorageGet.mockResolvedValue({
      [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: deadline
    });

    await expectSaga(setDelayForLockoutVaultSaga, startBackground())
      .provide([
        [matchers.select.selector(selectLoginRetryLockoutTime), NOW],
        instantDelay
      ])
      .call(delay, FIVE_SECONDS)
      .put(loginRetryCountReseted())
      .put(loginRetryLockoutTimeReseted())
      .run();

    expect(mockStorageRemove).toHaveBeenCalledWith(
      LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
    );
  });

  it('resumes on startBackground with an elapsed deadline: resets immediately without delaying', async () => {
    mockStorageGet.mockResolvedValue({
      [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: NOW - 1000
    });

    await expectSaga(setDelayForLockoutVaultSaga, startBackground())
      .provide([
        [matchers.select.selector(selectLoginRetryLockoutTime), NOW],
        instantDelay
      ])
      .not.call.fn(delay)
      .put(loginRetryCountReseted())
      .put(loginRetryLockoutTimeReseted())
      .run();
  });

  it('arms a fresh lockout: persists deadline = start + LOCK_VAULT_TIMEOUT and waits the full duration', async () => {
    await expectSaga(setDelayForLockoutVaultSaga, loginRetryLockoutTimeSet(NOW))
      .provide([
        [matchers.select.selector(selectLoginRetryLockoutTime), NOW],
        instantDelay
      ])
      .call(delay, LOCK_VAULT_TIMEOUT)
      .put(loginRetryCountReseted())
      .put(loginRetryLockoutTimeReseted())
      .run();

    expect(mockStorageSet).toHaveBeenCalledWith({
      [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: NOW + LOCK_VAULT_TIMEOUT
    });
  });

  it.each([
    ['a string', 'garbage'],
    ['NaN', NaN]
  ])(
    'falls back to recomputing the deadline when the persisted value is corrupt (%s) instead of resetting immediately',
    async (_label, corruptValue) => {
      mockStorageGet.mockResolvedValue({
        [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: corruptValue
      });

      await expectSaga(setDelayForLockoutVaultSaga, startBackground())
        .provide([
          [matchers.select.selector(selectLoginRetryLockoutTime), NOW],
          instantDelay
        ])
        // Recomputed from loginRetryLockoutTime — waits the full duration
        // rather than failing open into an immediate lockout reset.
        .call(delay, LOCK_VAULT_TIMEOUT)
        .put(loginRetryCountReseted())
        .put(loginRetryLockoutTimeReseted())
        .run();
    }
  );

  it('does nothing and clears any stale deadline when there is no active lockout', async () => {
    await expectSaga(setDelayForLockoutVaultSaga, startBackground())
      .provide([
        [matchers.select.selector(selectLoginRetryLockoutTime), null],
        instantDelay
      ])
      .not.call.fn(delay)
      .not.put(loginRetryCountReseted())
      .run();

    expect(mockStorageRemove).toHaveBeenCalledWith(
      LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
    );
  });
});

describe('armLockoutSaga — root-saga wiring', () => {
  // The four tests below invoke the saga directly, so replacing the trigger
  // array in `vaultSagas` leaves them all green with the saga wired to nothing.
  // These dispatch through the real root saga instead.
  // `selectLoginRetryLockoutTime` is here because arming wakes
  // `setDelayForLockoutVaultSaga`, which reads it; without it that saga runs
  // against an undefined state and the failure looks like a wiring problem.
  const armProviders = [
    [matchers.select.selector(selectLoginRetryCount), 5],
    [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
    [matchers.select.selector(selectVaultIsLocked), true],
    [matchers.select.selector(selectLoginRetryLockoutTime), null]
  ] as never[];

  it('arms on a retry increment', async () => {
    await expectSaga(vaultSagas)
      .provide(armProviders)
      .dispatch(loginRetryCountIncremented())
      .put(loginRetryLockoutTimeSet(NOW))
      .silentRun(50);
  });

  // The resume half: a count persisted past the limit with nothing armed. No
  // test covered this trigger at all — every other `startBackground` in the
  // suite invokes a saga directly, and no e2e restarts the worker.
  it('arms on startBackground, for a stale count that survived a restart', async () => {
    await expectSaga(vaultSagas)
      .provide(armProviders)
      .dispatch(startBackground())
      .put(loginRetryLockoutTimeSet(NOW))
      .silentRun(50);
  });
});

describe('armLockoutSaga', () => {
  it('does nothing below the attempts limit', async () => {
    await expectSaga(armLockoutSaga)
      .provide([
        [matchers.select.selector(selectLoginRetryCount), 4],
        [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
        [matchers.select.selector(selectVaultIsLocked), true]
      ])
      .not.put(loginRetryLockoutTimeSet(NOW))
      .not.put(lockVault())
      .run();
  });

  it('arms the lockout when the limit is reached', async () => {
    await expectSaga(armLockoutSaga)
      .provide([
        [matchers.select.selector(selectLoginRetryCount), 5],
        [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
        [matchers.select.selector(selectVaultIsLocked), true]
      ])
      .put(loginRetryLockoutTimeSet(NOW))
      .not.put(lockVault())
      .run();
  });

  it('does not re-arm an already-armed lockout, so a resume cannot restart the clock', async () => {
    await expectSaga(armLockoutSaga)
      .provide([
        [matchers.select.selector(selectLoginRetryCount), 7],
        [matchers.select.selector(selectHasLoginRetryLockoutTime), true],
        [matchers.select.selector(selectVaultIsLocked), true]
      ])
      .not.put(loginRetryLockoutTimeSet(NOW))
      .run();
  });

  it('also locks the vault when it is still unlocked (the protected-page case)', async () => {
    await expectSaga(armLockoutSaga)
      .provide([
        [matchers.select.selector(selectLoginRetryCount), 5],
        [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
        [matchers.select.selector(selectVaultIsLocked), false]
      ])
      .put(loginRetryLockoutTimeSet(NOW))
      .put(lockVault())
      .run();
  });
});

describe('timeoutCounterSaga', () => {
  const unlockedVaultProvides = (
    lastActivityTime: number | null,
    isLocked = false
  ): Array<[ReturnType<typeof matchers.select.selector>, unknown]> => [
    [matchers.select.selector(selectVaultCipherDoesExist), true],
    [matchers.select.selector(selectVaultIsLocked), isLocked],
    [matchers.select.selector(selectVaultLastActivityTime), lastActivityTime],
    [
      matchers.select.selector(selectTimeoutDurationSetting),
      TimeoutDurationSetting['5 min']
    ]
  ];

  const fiveMin =
    MapTimeoutDurationSettingToValue[TimeoutDurationSetting['5 min']];

  it('resumes on startBackground with a future deadline: waits the residual then locks', async () => {
    mockStorageGet.mockResolvedValue({
      [AUTO_LOCK_DEADLINE_KEY]: NOW + FIVE_SECONDS
    });

    await expectSaga(timeoutCounterSaga, startBackground())
      .provide([...unlockedVaultProvides(NOW), instantDelay])
      .call(delay, FIVE_SECONDS)
      .put(lockVault())
      .run();
  });

  it('resumes on startBackground with an elapsed deadline: locks immediately without delaying', async () => {
    mockStorageGet.mockResolvedValue({
      [AUTO_LOCK_DEADLINE_KEY]: NOW - 1000
    });

    await expectSaga(timeoutCounterSaga, startBackground())
      .provide([...unlockedVaultProvides(NOW), instantDelay])
      .not.call.fn(delay)
      .put(lockVault())
      .run();
  });

  it('arms on activity refresh: persists deadline = lastActivity + timeout, delays the residual, then locks', async () => {
    await expectSaga(timeoutCounterSaga, lastActivityTimeRefreshed())
      .provide([...unlockedVaultProvides(NOW), instantDelay])
      .call(delay, fiveMin)
      .put(lockVault())
      .run();

    expect(mockStorageSet).toHaveBeenCalledWith({
      [AUTO_LOCK_DEADLINE_KEY]: NOW + fiveMin
    });
  });

  it('falls back to recomputing the deadline when the persisted value is corrupt', async () => {
    mockStorageGet.mockResolvedValue({
      [AUTO_LOCK_DEADLINE_KEY]: 'garbage'
    });

    await expectSaga(timeoutCounterSaga, startBackground())
      .provide([...unlockedVaultProvides(NOW), instantDelay])
      // Recomputed from lastActivityTime — waits the full residual rather
      // than locking immediately off a garbage value.
      .call(delay, fiveMin)
      .put(lockVault())
      .run();
  });

  it('neither delays nor locks while the vault is locked, but clears the stale persisted deadline', async () => {
    await expectSaga(timeoutCounterSaga, startBackground())
      .provide([...unlockedVaultProvides(NOW, true), instantDelay])
      .not.call.fn(delay)
      .not.put(lockVault())
      .run();

    expect(mockStorageRemove).toHaveBeenCalledWith(AUTO_LOCK_DEADLINE_KEY);
  });
});

describe('lockVaultSaga', () => {
  // The flush re-encryption added at the top of lockVaultSaga now reaches these
  // selectors and the encrypt call; provide a live key + stub cipher so the
  // flush runs for real rather than throwing on a missing session.
  const flushProvides: Array<
    [
      (
        | ReturnType<typeof matchers.select.selector>
        | ReturnType<typeof matchers.call.fn>
      ),
      unknown
    ]
  > = [
    [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
    [matchers.select.selector(selectVault), EMPTY_VAULT],
    [matchers.call.fn(encryptVault), 'flushed-cipher']
  ];

  it('clears the persisted auto-lock deadline on lock (covers both timeout-fired and manual lock)', async () => {
    await expectSaga(lockVaultSaga).provide(flushProvides).run();

    expect(mockStorageRemove).toHaveBeenCalledWith(AUTO_LOCK_DEADLINE_KEY);
  });

  it('emits the locked event to tabs before touching storage, so a storage failure cannot skip the emit', async () => {
    await expectSaga(lockVaultSaga).provide(flushProvides).run();

    // tabs.query is the first thing emitSdkEventToActiveTabs does; asserting
    // its global invocation order against storage.local.remove proves the
    // emit is no longer sequenced behind the fallible storage call.
    expect(mockTabsQuery).toHaveBeenCalled();
    expect(mockStorageRemove).toHaveBeenCalledWith(AUTO_LOCK_DEADLINE_KEY);
    expect(mockTabsQuery.mock.invocationCallOrder[0]).toBeLessThan(
      mockStorageRemove.mock.invocationCallOrder[0]
    );
  });

  it('flushes a synchronous re-encryption before tearing the session down', async () => {
    // NB: no `.put(vaultCipherCreated(...))` expectation here — a matched
    // `.put()` expectation removes that effect from the returned `effects.put`
    // array, which would defeat the ordering assertion below. The
    // `toBeGreaterThanOrEqual(0)` check still proves the flush was put.
    const { effects } = await expectSaga(lockVaultSaga)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT],
        [matchers.call.fn(encryptVault), 'flushed-cipher']
      ])
      .run();

    // redux-saga-test-plan collects PUT effects in the order they were yielded.
    const putTypes = effects.put.map(
      (e: { payload: { action: { type: string } } }) => e.payload.action.type
    );
    expect(putTypes.indexOf(vaultCipherCreated.type)).toBeGreaterThanOrEqual(0);
    expect(putTypes.indexOf(vaultCipherCreated.type)).toBeLessThan(
      putTypes.indexOf(sessionReseted.type)
    );
  });
});

describe('unlockVaultSaga', () => {
  const vault = {} as never;
  const newKeyDerivationSaltHash = 'salt-hash';
  const newVaultCipher = 'new-cipher-blob';
  const newEncryptionKeyHash = 'new-key-hash';

  const unlockAction = unlockVault({
    vault,
    newKeyDerivationSaltHash,
    newVaultCipher,
    newEncryptionKeyHash
  });

  // Both selectors read after the puts. Provide them so the saga's happy path
  // runs to completion (no catch, no leaked console.error). `activeAccount`
  // toggles the SDK-event emit branch. `emitSdkEventToActiveTabs` /
  // `anchorServiceWorker` are not jest.mocked — same as `lockVaultSaga` above,
  // they run for real against the mocked `webextension-polyfill` (and the
  // anchor is a no-op off Chrome), so `mockTabsQuery` is the emit witness.
  const provides = (
    activeAccount: unknown
  ): Array<[ReturnType<typeof matchers.select.selector>, unknown]> => [
    [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
    [matchers.select.selector(selectAccountNamesByOriginDict), {}],
    [matchers.select.selector(selectVaultActiveAccount), activeAccount]
  ];

  it('puts the exact unlock action sequence, each payload driven from action.payload', async () => {
    await expectSaga(unlockVaultSaga, unlockAction)
      .provide(provides({ name: 'Account 1', publicKey: '0201abc' }))
      .put(loginRetryCountReseted())
      .put(vaultLoaded(vault))
      .put(keysUpdated({ keyDerivationSaltHash: newKeyDerivationSaltHash }))
      .put(vaultCipherCreated({ vaultCipher: newVaultCipher }))
      .put(
        encryptionKeyHashCreated({ encryptionKeyHash: newEncryptionKeyHash })
      )
      .put(vaultUnlocked())
      .run();
  });

  it('yields those puts in a deterministic order', async () => {
    // No `.put()` expectations here: a matched `.put()` removes that effect from
    // the returned `effects.put` array, which would defeat the ordering check.
    const { effects } = await expectSaga(unlockVaultSaga, unlockAction)
      .provide(provides({ name: 'Account 1', publicKey: '0201abc' }))
      .run();

    const putTypes = effects.put.map(
      (e: { payload: { action: { type: string } } }) => e.payload.action.type
    );

    expect(putTypes).toEqual([
      dismissSagaErrorsBySource.type,
      loginRetryCountReseted.type,
      vaultLoaded.type,
      keysUpdated.type,
      vaultCipherCreated.type,
      encryptionKeyHashCreated.type,
      vaultUnlocked.type
    ]);
  });

  it('emits the SDK unlocked event when there is an active account', async () => {
    await expectSaga(unlockVaultSaga, unlockAction)
      .provide(provides({ name: 'Account 1', publicKey: '0201abc' }))
      .put(vaultUnlocked())
      .run();

    // tabs.query is the first thing emitSdkEventToActiveTabs does — its call is
    // the witness that the emit branch ran.
    expect(mockTabsQuery).toHaveBeenCalled();
  });

  it('unlocks but skips the SDK emit when there is no active account', async () => {
    await expectSaga(unlockVaultSaga, unlockAction)
      .provide(provides(undefined))
      .put(vaultUnlocked())
      .run();

    expect(mockTabsQuery).not.toHaveBeenCalled();
  });

  it('refuses to unlock while a lockout is active', async () => {
    await expectSaga(unlockVaultSaga, unlockAction)
      .provide([
        [matchers.select.selector(selectHasLoginRetryLockoutTime), true]
      ])
      .put(dismissSagaErrorsBySource('unlockVaultSaga'))
      .put(
        sagaError({
          source: 'unlockVaultSaga',
          message: 'Too many failed attempts. Wait before unlocking again.'
        })
      )
      .not.put(loginRetryCountReseted())
      .not.put(vaultUnlocked())
      .run();
  });
});

describe('updateVaultCipher debounce', () => {
  it('coalesces a burst of vault edits into a single re-encryption', async () => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .dispatch(accountRenamed({ oldName: 'b', newName: 'c' }))
      .dispatch(accountRenamed({ oldName: 'c', newName: 'd' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).toHaveBeenCalledTimes(1);
  });

  // WALLET-1384: the vault reducer deletes an answered request's signing
  // payload, and that deletion must reach the cipher. Otherwise an MV3
  // service-worker restart re-loads the entry from a stale blob through
  // `vaultLoaded`, for a requestId whose `windowRequestResponded` has already
  // fired — so nothing would ever remove it.
  //
  // Driven through the REAL vault reducer (`withReducer`) and asserted on the
  // value handed to `encryptVault`, not on a call count. Providing `selectVault`
  // instead would pin only that `windowRequestResponded.type` sits in the
  // debounce array — the reducer half of the contract would go unobserved, and
  // deleting the whole `extraReducers` block would leave the test green.
  it('re-encrypts the vault WITHOUT the answered payload', async () => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    const seeded: VaultState = {
      ...EMPTY_VAULT,
      jsonById: { answered: 'gone', other: 'kept' },
      eip712ById: { answered: 'gone' }
    };

    await expectSaga(vaultSagas)
      .withReducer(
        combineReducers({ vault: vaultReducer }) as never,
        {
          vault: seeded
        } as never
      )
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash']
      ])
      .dispatch(windowRequestResponded({ requestId: 'answered' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).toHaveBeenCalledTimes(1);
    // `toEqual` on each map, not `toMatchObject` on the vault: a recursive
    // subset match tolerates the very key this test exists to prove is gone.
    const encrypted = encryptSpy.mock.calls[0][1];
    expect(encrypted.jsonById).toEqual({ other: 'kept' });
    expect(encrypted.eip712ById).toEqual({});
  });

  it('re-encrypts once per edit when edits are spaced beyond the debounce window', async () => {
    // The other half of the debounce contract: coalescing must not become
    // over-coalescing. Edits further apart than the window must each persist —
    // the burst test above cannot distinguish a correct trailing-edge debounce
    // from a configuration that swallows every edit after the first (e.g. a
    // future swap to throttle/takeLeading, or a fattened window).
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .delay(VAULT_REENCRYPT_DEBOUNCE_MS + 100)
      .dispatch(accountRenamed({ oldName: 'b', newName: 'c' }))
      .silentRun(2 * VAULT_REENCRYPT_DEBOUNCE_MS + 400);

    expect(encryptSpy).toHaveBeenCalledTimes(2);
  });

  it('is a silent no-op when a debounced run lands after the session is locked', async () => {
    // Straggler-after-lock: a trigger fired < 500ms before a lock re-arms the
    // debounce, then lockVaultSaga wipes the session key, and the trailing run
    // lands with encryptionKeyHash === null. It must NOT re-encrypt (no stale
    // cipher can overwrite the lock flush) and must NOT surface a sagaError to
    // the UI banner — a locked session is not an error.
    const encryptSpy = jest.spyOn(vaultCryptoModule, 'encryptVault');

    const { effects } = await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), null],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).not.toHaveBeenCalled();
    const putTypes = (effects.put ?? []).map(
      (e: { payload: { action: { type: string } } }) => e.payload.action.type
    );
    expect(putTypes).not.toContain(vaultCipherCreated.type);
    expect(putTypes).not.toContain(sagaError.type);
  });
});

// WALLET-1418. `MAX_STORED_PAYLOADS` refuses the INCOMING write once
// `jsonById`/`eip712ById` hold ten entries, and the only path that evicts a
// stored one is `mergePayloadMaps` — which runs inside the reducer, on the same
// `vaultLoaded` this saga takes, so it has already decided what survives before
// this saga sees the action and cannot be relied on to reclaim anything for it.
// So ten payloads whose `windowRequestResponded` never arrived — a clean
// auto-lock with an approval window open is enough, no worker death needed —
// permanently refuse every later `sign` on the profile. This saga is the
// deliberate replacement for the accidental exit `vaultLoaded` used to provide.
describe('reconcileStalePayloadsSaga', () => {
  const EMPTY_WINDOW_MANAGEMENT: WindowManagementState = {
    windowId: null,
    exportKeysWindowId: null,
    requests: {}
  };

  // Hash included, as `createOpenWindow` produces it: `searchParams` must find
  // `requestId` in front of a fragment.
  const approvalWindowUrl = (requestId: string) =>
    `chrome-extension://abcdefghijklmnop/signature-request.html` +
    `?requestId=${requestId}&origin=https%3A%2F%2Fdapp.example&tabId=7` +
    `#/sign-deploy`;

  const openRequest = {
    status: 'open',
    tabId: 7,
    origin: 'https://dapp.example',
    method: 'sign',
    windowIds: [1],
    awaitingDeviceConfirmation: false
  } as const;

  const combinedReducer = () =>
    combineReducers({
      vault: vaultReducer,
      windowManagement: windowManagementReducer
    }) as never;

  const seedState = (
    vault: Partial<VaultState>,
    windowManagement: Partial<WindowManagementState> = {}
  ) =>
    ({
      vault: { ...EMPTY_VAULT, ...vault },
      windowManagement: { ...EMPTY_WINDOW_MANAGEMENT, ...windowManagement }
    }) as never;

  const vaultOf = (storeState: unknown) =>
    (storeState as { vault: VaultState }).vault;

  // The window half of the keep-set. `windowManagement.requests` is not
  // persisted, so after a service-worker restart the descriptor is gone while
  // the window is still on screen and still signable.
  it('keeps a payload whose requestId appears in an open window tab URL, with no descriptor in the store', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('live-1') }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({ jsonById: { 'live-1': '{"deploy":1}' } })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({ 'live-1': '{"deploy":1}' });
  });

  // The other half. On window reuse `tabs.update` resolves when navigation
  // starts, so a live window can still report the previous request's URL.
  it('keeps a payload whose requestId is an open request but appears in no window URL', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('previous-request') }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState(
          { jsonById: { navigating: '{"deploy":2}' } },
          { requests: { navigating: openRequest } }
        )
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({
      navigating: '{"deploy":2}'
    });
  });

  it('purges a payload in neither the window URLs nor the open requests, from BOTH maps', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('live-1') }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({
          jsonById: { 'live-1': '{"deploy":1}', orphan: '{"deploy":9}' },
          eip712ById: { orphan: '{"eip712":9}', 'orphan-2': '{"eip712":8}' }
        })
      )
      .run();

    // `toEqual`, never `toMatchObject`: a subset match tolerates the very key
    // this test proves is gone.
    expect(vaultOf(storeState).jsonById).toEqual({ 'live-1': '{"deploy":1}' });
    expect(vaultOf(storeState).eip712ById).toEqual({});
  });

  // `windowManagement`'s reducer no-ops the transition unless the request is
  // 'open', so an orphan spends none of the `MAX_RESPONDED_TOMBSTONES` budget,
  // while the vault reducer keys off the action and still deletes the payload.
  it('does not leave a responded tombstone behind for a purged orphan', async () => {
    mockWindowsGetAll.mockResolvedValue([]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({ jsonById: { orphan: '{"deploy":9}' } })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({});
    expect(
      (storeState as { windowManagement: WindowManagementState })
        .windowManagement.requests
    ).toEqual({});
  });

  // Fail closed: a rejected enumeration is no evidence, and purging on no
  // evidence strands a live request.
  it('purges nothing when windows.getAll rejects', async () => {
    mockWindowsGetAll.mockRejectedValue(new Error('no windows API'));

    const { storeState, effects } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({
          jsonById: { orphan: '{"deploy":9}' },
          eip712ById: { 'orphan-2': '{"eip712":8}' }
        })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({ orphan: '{"deploy":9}' });
    expect(vaultOf(storeState).eip712ById).toEqual({
      'orphan-2': '{"eip712":8}'
    });
    expect(effects.put ?? []).toEqual([]);
  });

  // A window can be enumerated before its first tab has a URL. That is not an
  // error and may not abort the run.
  it('does not throw when windows have tabs without a url, and still keeps what selectOpenRequests covers', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{}] },
      { id: 2, tabs: [{ url: '' }] },
      { id: 3 }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState(
          { jsonById: { navigating: '{"deploy":2}', orphan: '{"deploy":9}' } },
          { requests: { navigating: openRequest } }
        )
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({
      navigating: '{"deploy":2}'
    });
  });

  it('skips a tab whose url cannot be parsed without aborting the run', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: 'not a url' }] },
      { id: 2, tabs: [{ url: approvalWindowUrl('live-1') }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({
          jsonById: { 'live-1': '{"deploy":1}', orphan: '{"deploy":9}' }
        })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({ 'live-1': '{"deploy":1}' });
  });

  // The Ledger permission window carries the same requestId as the approval
  // window that spawned it (`src/hooks/use-ledger.ts`).
  it('unions requestIds across every window rather than taking the last one seen', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('ledger-request') }] },
      { id: 2, tabs: [{ url: approvalWindowUrl('other-request') }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({
          jsonById: {
            'ledger-request': '{"deploy":1}',
            'other-request': '{"deploy":2}'
          }
        })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({
      'ledger-request': '{"deploy":1}',
      'other-request': '{"deploy":2}'
    });
  });

  // The param is dapp-chosen: without the origin check an origin that knows the
  // ids it leaked could keep them alive from its own tab.
  it('does not let a non-extension tab carrying the same requestId keep a payload alive', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: 'https://evil.example/?requestId=orphan' }] }
    ]);

    const { storeState } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({ jsonById: { orphan: '{"deploy":9}' } })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({});
  });

  // Enumerating anyway would pull every tab URL in the browser into the
  // extension process for no gain.
  it('does not enumerate windows at all when both payload maps are empty', async () => {
    const { effects } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(combinedReducer(), seedState({}))
      .run();

    expect(mockWindowsGetAll).not.toHaveBeenCalled();
    expect(effects.put ?? []).toEqual([]);
  });

  // An escaping throw would abort the whole saga tree. Driven by an enumeration
  // that resolves with a non-list, the one way past the oracle's own catch.
  it('contains an unexpected throw, purges nothing, and reports it', async () => {
    mockWindowsGetAll.mockResolvedValue(undefined);

    const { storeState, effects } = await expectSaga(reconcileStalePayloadsSaga)
      .withReducer(
        combinedReducer(),
        seedState({ jsonById: { orphan: '{"deploy":9}' } })
      )
      .put(
        sagaError({
          source: 'reconcileStalePayloadsSaga',
          message: 'Could not reclaim stored signing payloads'
        })
      )
      .run();

    expect(vaultOf(storeState).jsonById).toEqual({ orphan: '{"deploy":9}' });
    // The matched `.put()` above is removed from `effects.put`, so what is left
    // must be empty: no `windowRequestResponded` escaped before the throw.
    expect(effects.put ?? []).toEqual([]);
  });

  // The ordering guard: hoisting the two `sagaSelect` calls above the `sagaCall`
  // leaves every other test in this file green. `fresh` arrives during the round
  // trip, so a keep-set read before it would purge a request the user is about
  // to sign. The provider — not a `.dispatch()`, which only flushes against a
  // matching `take` — is what observes WHEN the read happens.
  it('computes the keep-set AFTER the window round trip, so a request registered during it survives', async () => {
    let roundTripDone = false;

    mockWindowsGetAll.mockImplementation(
      () =>
        new Promise<unknown[]>(resolve =>
          setTimeout(() => {
            roundTripDone = true;
            resolve([]);
          }, 120)
        )
    );

    // No window is ever reported: the descriptor is the only thing that can
    // save `fresh`.
    const { storeState } = await expectSaga(vaultSagas)
      .withReducer(
        combinedReducer(),
        // `fresh` arrived while the vault was locked and lives only in memory.
        seedState({ jsonById: { fresh: '{"deploy":42}' } })
      )
      .provide({
        select({ selector }: { selector: unknown }, next: () => unknown) {
          if (selector === selectEncryptionKeyHash) {
            return null;
          }
          if (selector === selectOpenRequests) {
            return roundTripDone
              ? [
                  {
                    requestId: 'fresh',
                    status: 'open',
                    tabId: 7,
                    origin: 'https://dapp.example',
                    method: 'sign',
                    windowIds: [1]
                  }
                ]
              : [];
          }
          return next();
        }
      } as never)
      // The cipher contributes the leaked `orphan`; the merge is Task 1's.
      .dispatch(
        vaultLoaded({ ...EMPTY_VAULT, jsonById: { orphan: '{"deploy":9}' } })
      )
      .silentRun(600);

    expect(vaultOf(storeState).jsonById).toEqual({ fresh: '{"deploy":42}' });
  });

  // The acceptance test, driven through the root saga so the
  // `takeLatest(vaultLoaded.type, …)` registration is part of what is asserted.
  it('reclaims all ten leaked slots on vaultLoaded so the next deploy payload is accepted', async () => {
    mockWindowsGetAll.mockResolvedValue([]);

    const leaked = Object.fromEntries(
      Array.from({ length: MAX_STORED_PAYLOADS }, (_, i) => [
        `leaked-${i}`,
        `{"deploy":${i}}`
      ])
    );

    const { storeState } = await expectSaga(vaultSagas)
      .withReducer(combinedReducer(), seedState({}))
      // A null key makes `updateVaultCipher` early-return instead of reaching
      // a `session` slice this reducer has not got.
      .provide([[matchers.select.selector(selectEncryptionKeyHash), null]])
      .dispatch(vaultLoaded({ ...EMPTY_VAULT, jsonById: leaked }))
      // Without this gap the fresh payload is offered to a map still holding
      // ten entries and refused — which is the bug, not the fix.
      .delay(50)
      .dispatch(
        deployPayloadReceived({ id: 'fresh-request', json: '{"fresh":true}' })
      )
      .silentRun(200);

    expect(vaultOf(storeState).jsonById).toEqual({
      'fresh-request': '{"fresh":true}'
    });
  });

  // Without a re-encryption the cipher still holds the entry and the next
  // `vaultLoaded` resurrects it; this pins `windowRequestResponded.type` in the
  // debounce array.
  it('carries the reclaimed slots into the re-encrypted cipher', async () => {
    mockWindowsGetAll.mockResolvedValue([
      { id: 1, tabs: [{ url: approvalWindowUrl('live-1') }] }
    ]);

    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .withReducer(combinedReducer(), seedState({}))
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash']
      ])
      .dispatch(
        vaultLoaded({
          ...EMPTY_VAULT,
          jsonById: { 'live-1': '{"deploy":1}', orphan: '{"deploy":9}' },
          eip712ById: { 'orphan-2': '{"eip712":8}' }
        })
      )
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 300);

    expect(encryptSpy).toHaveBeenCalled();
    const encrypted =
      encryptSpy.mock.calls[encryptSpy.mock.calls.length - 1][1];
    expect(encrypted.jsonById).toEqual({ 'live-1': '{"deploy":1}' });
    expect(encrypted.eip712ById).toEqual({});
  });
});

// WALLET-1418. `eip712ById` entered `VaultState` after v2.4.2 shipped,
// `decryptVault` is a bare `JSON.parse` cast and no migration exists, so an old
// cipher decrypts without the field. A throw in `sanitizePayloadMap` lands in
// `put(vaultLoaded(vault))`, is swallowed by `unlockVaultSaga`'s own catch, and
// the vault never unlocks again. Driven through the REAL crypto: a hand-shaped
// `vaultLoaded` payload cannot show that the round trip produces that shape.
describe('unlockVaultSaga on a cipher written before a payload map existed', () => {
  const PAYLOAD_MAPS = ['jsonById', 'eip712ById'] as const;

  const ENTRIES = {
    jsonById: { 'req-json': '{"deploy":1}' },
    eip712ById: { 'req-eip': '{"eip712":2}' }
  };

  const legacyVaultState = (missing: (typeof PAYLOAD_MAPS)[number]) => {
    const vault: VaultState = {
      secretPhrase: ['w1', 'w2'],
      accounts: [
        {
          name: 'Account 1',
          publicKey: '0201aa',
          secretKey: 'sk-1',
          hidden: false
        },
        {
          name: 'Account 2',
          publicKey: '0201bb',
          secretKey: 'sk-2',
          hidden: false
        }
      ],
      accountNamesByOriginDict: { 'https://dapp.example': ['Account 1'] },
      siteNameByOriginDict: { 'https://dapp.example': 'Dapp' },
      activeAccountName: 'Account 1',
      jsonById: ENTRIES.jsonById,
      eip712ById: ENTRIES.eip712ById,
      payloadSeqById: { 'req-json': 0, 'req-eip': 1 }
    };

    // The key absent, as `JSON.stringify` produced on a build without it.
    delete (vault as Partial<VaultState>)[missing];

    return vault;
  };

  const decryptLegacyCipher = async (
    missing: (typeof PAYLOAD_MAPS)[number]
  ) => {
    const cipher = await encryptVault(
      FIXED_ENCRYPTION_KEY_HASH,
      legacyVaultState(missing)
    );

    return decryptVault(FIXED_ENCRYPTION_KEY_HASH, cipher);
  };

  it.each(PAYLOAD_MAPS)(
    'round-trips through the real crypto into an object owning no %s',
    async missing => {
      const decrypted = await decryptLegacyCipher(missing);

      expect(Object.prototype.hasOwnProperty.call(decrypted, missing)).toBe(
        false
      );
    }
  );

  it.each(PAYLOAD_MAPS)(
    'completes the unlock with %s absent, defaulting it to an empty dict',
    async missing => {
      const decrypted = await decryptLegacyCipher(missing);
      const present = missing === 'jsonById' ? 'eip712ById' : 'jsonById';

      const { storeState, effects } = await expectSaga(
        unlockVaultSaga,
        unlockVault({
          vault: decrypted,
          newKeyDerivationSaltHash: 'salt-hash',
          newVaultCipher: 'new-cipher-blob',
          newEncryptionKeyHash: 'new-key-hash'
        })
      )
        .withReducer(
          combineReducers({ vault: vaultReducer }) as never,
          { vault: EMPTY_VAULT } as never
        )
        .put(vaultUnlocked())
        .run();

      const putTypes = (
        (effects.put ?? []) as Array<{
          payload: { action: { type: string } };
        }>
      ).map(e => e.payload.action.type);
      expect(putTypes).not.toContain(sagaError.type);

      const vault = (storeState as { vault: VaultState }).vault;

      expect(vault[missing]).toEqual({});
      expect(vault[present]).toEqual(ENTRIES[present]);
      expect(vault.accounts.map(account => account.name)).toEqual([
        'Account 1',
        'Account 2'
      ]);
      expect(vault.activeAccountName).toBe('Account 1');
    }
  );
});

// The collision loop is the whole point of this saga: a broken `i++` either
// reuses a taken derivation index or never terminates, wedging the SW.
describe('createAccountSaga', () => {
  const keyPairAt = (index: number) => ({
    publicKey: `01pub${index}`,
    secretKey: `sec${index}`
  });

  const derived = (index: number) => ({
    ...keyPairAt(index),
    name: `account ${index}`,
    hidden: false,
    derivationIndex: index
  });

  const runCreate = (
    derivedAccounts: ReturnType<typeof derived>[],
    name: string
  ) =>
    expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectVaultDerivedAccounts), derivedAccounts],
        [matchers.select.selector(selectSecretPhrase), ['word', 'word']]
      ])
      .dispatch(createAccount({ name }))
      .silentRun(50);

  beforeEach(() => {
    jest
      .spyOn(bip32Module, 'deriveKeyPair')
      .mockImplementation((_phrase, index) => keyPairAt(index) as never);
  });

  it('derives at index 0 for an empty vault', async () => {
    const { effects } = await runCreate([], 'first');

    expect(effects.put).toContainEqual(
      put(
        accountAdded({
          ...keyPairAt(0),
          name: 'first',
          hidden: false,
          derivationIndex: 0
        })
      )
    );
  });

  // Indices 0..2 are taken, so the new account must land on 3 — an assertion
  // that merely "a put happened" would pass with a reused index.
  it('skips past every taken derivation index', async () => {
    const { effects } = await runCreate(
      [derived(0), derived(1), derived(2)],
      'fourth'
    );

    expect(effects.put).toContainEqual(
      put(
        accountAdded({
          ...keyPairAt(3),
          name: 'fourth',
          hidden: false,
          derivationIndex: 3
        })
      )
    );
  });

  it('reports a duplicate account name and derives nothing', async () => {
    const { effects } = await runCreate([derived(0)], 'account 0');

    expect(effects.put).toContainEqual(
      put(
        sagaError({
          source: 'createAccountSaga',
          message: 'Account name exist'
        })
      )
    );
    expect(bip32Module.deriveKeyPair).not.toHaveBeenCalled();
  });

  it('reports a missing account name', async () => {
    const { effects } = await runCreate([], null as unknown as string);

    expect(effects.put).toContainEqual(
      put(
        sagaError({
          source: 'createAccountSaga',
          message: 'Account name missing'
        })
      )
    );
  });
});

// Every catch in this module funnels into the same broadcast error channel.
// Each test forces exactly one of them and pins its `source` string — the
// banner and the saga are wired together by that literal.
describe('saga error channel', () => {
  it('reports an encryption failure from updateVaultCipher', async () => {
    jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockRejectedValue(Error('encrypt failed'));

    const { effects } = await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(effects.put).toContainEqual(
      put(
        sagaError({
          source: 'updateVaultCipher',
          message: 'encrypt failed'
        })
      )
    );
  });

  it('reports a failed lock flush from lockVaultSaga', async () => {
    mockStorageRemove.mockRejectedValue(Error('storage gone'));

    const { effects } = await expectSaga(lockVaultSaga)
      .provide([[matchers.select.selector(selectEncryptionKeyHash), null]])
      .silentRun(50);

    expect(effects.put).toContainEqual(
      put(sagaError({ source: 'lockVaultSaga', message: 'storage gone' }))
    );
  });

  it('reports a failure from unlockVaultSaga', async () => {
    const { effects } = await expectSaga(
      unlockVaultSaga,
      unlockVault({
        vault: EMPTY_VAULT,
        newKeyDerivationSaltHash: 'salt',
        newVaultCipher: 'cipher',
        newEncryptionKeyHash: 'hash'
      })
    )
      .provide([
        [matchers.select.selector(selectHasLoginRetryLockoutTime), false],
        [
          matchers.select.selector(selectAccountNamesByOriginDict),
          throwError(Error('unlock failed'))
        ]
      ])
      .silentRun(50);

    expect(effects.put).toContainEqual(
      put(sagaError({ source: 'unlockVaultSaga', message: 'unlock failed' }))
    );
  });

  it('reports a failure from timeoutCounterSaga', async () => {
    mockStorageGet.mockRejectedValue(Error('read failed'));

    const { effects } = await expectSaga(timeoutCounterSaga, startBackground())
      .provide([
        [matchers.select.selector(selectVaultCipherDoesExist), true],
        [matchers.select.selector(selectVaultIsLocked), false],
        [
          matchers.select.selector(selectTimeoutDurationSetting),
          TimeoutDurationSetting['5 min']
        ],
        [matchers.select.selector(selectVaultLastActivityTime), NOW]
      ])
      .silentRun(50);

    expect(effects.put).toContainEqual(
      put(sagaError({ source: 'timeoutCounterSaga', message: 'read failed' }))
    );
  });
});

describe('changePasswordSaga', () => {
  const payload = {
    currentPassword: 'old-password',
    password: 'new-password'
  };

  const SEEDED_VAULT: VaultState = {
    ...EMPTY_VAULT,
    secretPhrase: ['w1', 'w2'],
    accounts: [{ name: 'A', publicKey: 'pk', secretKey: 'sk', hidden: false }]
  };

  // The two scrypt derivations the saga now runs itself; the real ones are
  // N = 2 ** 18 and would take seconds each.
  const KEYS_WITH_PASSWORD = {
    passwordHash: 'stored-password-hash',
    passwordSaltHash: 'stored-password-salt',
    keyDerivationSaltHash: 'stored-derivation-salt',
    keysDoesExist: true
  };

  const stubDerivation = () => {
    jest.spyOn(scryptModule, 'verifyPasswordOffThread').mockResolvedValue(true);
    jest
      .spyOn(hashingModule, 'generateRandomSaltHex')
      .mockReturnValueOnce('password-salt')
      .mockReturnValueOnce('derivation-salt');
    jest
      .spyOn(scryptModule, 'encodePasswordOffThread')
      .mockResolvedValue('new-password-hash');
    jest
      .spyOn(scryptModule, 'deriveScryptKey')
      .mockResolvedValue(Uint8Array.from([0xab, 0xcd]));
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('derives the new material itself and re-encrypts the background vault', async () => {
    stubDerivation();
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-under-new-key');

    await expectSaga(changePasswordSaga, changePassword(payload))
      .withReducer(
        combineReducers({
          vault: vaultReducer,
          session: sessionReducer,
          keys: keysReducer,
          vaultCipher: vaultCipherReducer
        }) as never,
        {
          vault: SEEDED_VAULT,
          keys: KEYS_WITH_PASSWORD,
          session: {
            encryptionKeyHash: 'old-key',
            encryptionKeyDoesExist: true,
            isLocked: false,
            isContactEditingAllowed: false
          }
        } as never
      )
      .put(
        keysUpdated({
          passwordHash: 'new-password-hash',
          passwordSaltHash: 'password-salt',
          keyDerivationSaltHash: 'derivation-salt'
        })
      )
      .put(encryptionKeyHashCreated({ encryptionKeyHash: 'abcd' }))
      .put(vaultCipherCreated({ vaultCipher: 'cipher-under-new-key' }))
      .run();

    // The current password is checked in the background, against the stored
    // hash — not taken on the page's word for it.
    expect(scryptModule.verifyPasswordOffThread).toHaveBeenCalledWith(
      'stored-password-hash',
      'stored-password-salt',
      'old-password'
    );
    // Both derivations run against the plaintext password from the payload —
    // the caller never gets to name the key the vault is re-encrypted under.
    expect(scryptModule.deriveScryptKey).toHaveBeenCalledWith(
      'new-password',
      'derivation-salt'
    );
    // The key is the NEW one and the vault is the background's own, not a replica's.
    expect(encryptSpy).toHaveBeenCalledWith(
      'abcd',
      expect.objectContaining({ secretPhrase: ['w1', 'w2'] })
    );
  });

  it('reports a malformed payload instead of throwing past its own catch', async () => {
    // `{ type }` with no payload is a shape isChangePasswordPayload must reject
    // gracefully; a destructure above the `try` would take rootSaga down with it.
    const encryptSpy = jest.spyOn(vaultCryptoModule, 'encryptVault');

    await expectSaga(changePasswordSaga, {
      type: changePassword.type
    } as ReturnType<typeof changePassword>)
      .provide([[matchers.select.selector(selectVaultIsLocked), false]])
      .not.put.actionType(keysUpdated.type)
      .not.put.actionType(encryptionKeyHashCreated.type)
      .not.put.actionType(vaultCipherCreated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: errorToMessage(Error('Malformed changePassword payload'))
        })
      )
      .run();

    expect(encryptSpy).not.toHaveBeenCalled();
  });

  it('refuses an empty new password', async () => {
    stubDerivation();

    await expectSaga(
      changePasswordSaga,
      changePassword({ currentPassword: 'old-password', password: '' })
    )
      .provide([[matchers.select.selector(selectVaultIsLocked), false]])
      .not.put.actionType(keysUpdated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: errorToMessage(Error('Malformed changePassword payload'))
        })
      )
      .run();

    expect(scryptModule.verifyPasswordOffThread).not.toHaveBeenCalled();
  });

  it('retracts what a previous attempt reported before re-attempting', async () => {
    stubDerivation();
    jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-under-new-key');

    await expectSaga(changePasswordSaga, changePassword(payload))
      .provide([
        [matchers.select.selector(selectVaultIsLocked), false],
        [matchers.select.selector(selectVault), SEEDED_VAULT],
        [matchers.select.selector(selectPasswordHash), 'stored-password-hash'],
        [
          matchers.select.selector(selectPasswordSaltHash),
          'stored-password-salt'
        ]
      ])
      .put(dismissSagaErrorsBySource('changePasswordSaga'))
      .run();
  });

  it('refuses when the current password is wrong', async () => {
    stubDerivation();
    jest
      .spyOn(scryptModule, 'verifyPasswordOffThread')
      .mockResolvedValue(false);
    const encryptSpy = jest.spyOn(vaultCryptoModule, 'encryptVault');

    await expectSaga(changePasswordSaga, changePassword(payload))
      .provide([
        [matchers.select.selector(selectVaultIsLocked), false],
        [matchers.select.selector(selectVault), SEEDED_VAULT],
        [matchers.select.selector(selectPasswordHash), 'stored-password-hash'],
        [
          matchers.select.selector(selectPasswordSaltHash),
          'stored-password-salt'
        ]
      ])
      .not.put.actionType(keysUpdated.type)
      .not.put.actionType(encryptionKeyHashCreated.type)
      .not.put.actionType(vaultCipherCreated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the current password is wrong.'
        })
      )
      .run();

    // Rejected before the new material is derived, let alone stored.
    expect(scryptModule.encodePasswordOffThread).not.toHaveBeenCalled();
    expect(encryptSpy).not.toHaveBeenCalled();
  });

  it('refuses when no password is set at all', async () => {
    stubDerivation();

    await expectSaga(changePasswordSaga, changePassword(payload))
      .provide([
        [matchers.select.selector(selectVaultIsLocked), false],
        [matchers.select.selector(selectVault), SEEDED_VAULT],
        [matchers.select.selector(selectPasswordHash), null],
        [matchers.select.selector(selectPasswordSaltHash), null]
      ])
      .not.put.actionType(keysUpdated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: errorToMessage(Error('No password is set'))
        })
      )
      .run();

    expect(scryptModule.verifyPasswordOffThread).not.toHaveBeenCalled();
  });

  it('does nothing at all when the vault is already locked', async () => {
    stubDerivation();
    const encryptSpy = jest.spyOn(vaultCryptoModule, 'encryptVault');

    await expectSaga(changePasswordSaga, changePassword(payload))
      .withReducer(
        combineReducers({
          vault: vaultReducer,
          session: sessionReducer,
          keys: keysReducer,
          vaultCipher: vaultCipherReducer
        }) as never,
        {
          // Post-lock: session reset, vault emptied.
          vault: EMPTY_VAULT,
          keys: KEYS_WITH_PASSWORD,
          session: {
            encryptionKeyHash: null,
            encryptionKeyDoesExist: false,
            isLocked: true,
            isContactEditingAllowed: false
          }
        } as never
      )
      .not.put.actionType(keysUpdated.type)
      .not.put.actionType(encryptionKeyHashCreated.type)
      .not.put.actionType(vaultCipherCreated.type)
      // sagaError is the ONLY signal that reaches the user here — without it
      // they'd walk away believing the new password took effect.
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the wallet locked. Try again.'
        })
      )
      .run();

    // Fail closed, and without burning two scrypt derivations first.
    expect(scryptModule.encodePasswordOffThread).not.toHaveBeenCalled();
    expect(encryptSpy).not.toHaveBeenCalled();
  });

  it('puts nothing but a sagaError when encryptVault throws', async () => {
    stubDerivation();
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockRejectedValue(new Error('malformed key'));

    await expectSaga(changePasswordSaga, changePassword(payload))
      .provide([
        [matchers.select.selector(selectVaultIsLocked), false],
        [matchers.select.selector(selectVault), SEEDED_VAULT],
        [matchers.select.selector(selectPasswordHash), 'stored-password-hash'],
        [
          matchers.select.selector(selectPasswordSaltHash),
          'stored-password-salt'
        ]
      ])
      .not.put.actionType(keysUpdated.type)
      .not.put.actionType(encryptionKeyHashCreated.type)
      .not.put.actionType(vaultCipherCreated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: errorToMessage(new Error('malformed key'))
        })
      )
      .run();

    // Old keys and old cipher are both untouched — nothing was persisted
    // between "encrypt failed" and "user finds out".
    expect(encryptSpy).toHaveBeenCalledWith('abcd', SEEDED_VAULT);
  });

  it('bails without persisting when the vault locks mid-derivation', async () => {
    // First selectVaultIsLocked call is the pre-check (unlocked); the second is
    // the post-encrypt re-check — a lock landing while the scrypt derivations
    // and `encryptVault` are still in flight.
    let isLockedCalls = 0;

    stubDerivation();
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-under-new-key');

    await expectSaga(changePasswordSaga, changePassword(payload))
      .provide([
        [
          matchers.select.selector(selectVaultIsLocked),
          dynamic(() => isLockedCalls++ > 0)
        ],
        [matchers.select.selector(selectVault), SEEDED_VAULT],
        [matchers.select.selector(selectPasswordHash), 'stored-password-hash'],
        [
          matchers.select.selector(selectPasswordSaltHash),
          'stored-password-salt'
        ]
      ])
      .not.put.actionType(keysUpdated.type)
      .not.put.actionType(encryptionKeyHashCreated.type)
      .not.put.actionType(vaultCipherCreated.type)
      .put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the wallet locked. Try again.'
        })
      )
      .run();

    // The encrypt itself was allowed to finish — only planting the result was
    // aborted. A locked wallet must never receive a new session key.
    expect(encryptSpy).toHaveBeenCalled();
  });
});

const NEW_ACCOUNT: Account = {
  name: 'imported one',
  publicKey: '01aa',
  secretKey: 'c2VjcmV0',
  hidden: false,
  derivationIndex: 0
};

const ACTION_BY_NAME = {
  accountAdded: accountAdded(NEW_ACCOUNT),
  accountImported: accountImported({ ...NEW_ACCOUNT, imported: true }),
  accountsAdded: accountsAdded([NEW_ACCOUNT]),
  accountsImported: accountsImported([{ ...NEW_ACCOUNT, imported: true }])
};

describe('account mutations bypass the debounce', () => {
  // An imported secret key exists nowhere else; losing it to a crash inside the
  // debounce window is unrecoverable, unlike a rename.
  it.each([
    'accountImported',
    'accountAdded',
    'accountsImported',
    'accountsAdded'
  ])('re-encrypts on %s without waiting out the window', async actionName => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(ACTION_BY_NAME[actionName as keyof typeof ACTION_BY_NAME])
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS - 100);

    expect(encryptSpy).toHaveBeenCalledTimes(1);
  });

  it('still coalesces the debounced actions', async () => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .dispatch(accountRenamed({ oldName: 'b', newName: 'c' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).toHaveBeenCalledTimes(1);
  });

  it('writes immediately for an import and once more for a coincident rename', async () => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), EMPTY_VAULT]
      ])
      .dispatch(ACTION_BY_NAME.accountImported)
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).toHaveBeenCalledTimes(2);
  });
});
