import * as matchers from 'redux-saga-test-plan/matchers';
import { expectSaga } from 'redux-saga-test-plan';
import { storage, tabs } from 'webextension-polyfill';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue,
  TimeoutDurationSetting
} from '@popup/constants';

import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/get-main-store';
import { loginRetryLockoutTimeReseted } from '@background/redux/login-retry-lockout-time/actions';
import { selectLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';

import * as vaultCryptoModule from '@libs/crypto/vault';
import { encryptVault } from '@libs/crypto/vault';

import { lastActivityTimeRefreshed } from '../last-activity-time/actions';
import { selectVaultLastActivityTime } from '../last-activity-time/selectors';
import { loginRetryCountReseted } from '../login-retry-count/actions';
import { loginRetryLockoutTimeSet } from '../login-retry-lockout-time/reducer';
import { sessionReseted } from '../session/actions';
import {
  selectEncryptionKeyHash,
  selectVaultIsLocked
} from '../session/selectors';
import { selectTimeoutDurationSetting } from '../settings/selectors';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { selectVaultCipherDoesExist } from '../vault-cipher/selectors';
import { accountRenamed } from '../vault/actions';
import { selectVault } from '../vault/selectors';
import { lockVault, startBackground } from './actions';
import {
  VAULT_REENCRYPT_DEBOUNCE_MS,
  delay,
  lockVaultSaga,
  setDelayForLockoutVaultSaga,
  timeoutCounterSaga,
  vaultSagas
} from './vault-sagas';

// Stub the storage-key module so importing it does not drag in the Redux store
// (get-main-store -> redux/index -> @redux-devtools/remote -> nanoid ESM, which
// jest cannot parse). The literals below MUST stay in lockstep with the real
// keys in get-main-store.ts — they are immutable once shipped.
jest.mock('@background/redux/get-main-store', () => ({
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY: 'q9Tf3Lm4pRxVne',
  AUTO_LOCK_DEADLINE_KEY: 'r3Wj7Nc8vBhQyD'
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined)
    }
  },
  runtime: { sendMessage: jest.fn().mockResolvedValue(undefined) },
  tabs: { query: jest.fn().mockResolvedValue([]), sendMessage: jest.fn() }
}));

const mockStorageGet = storage.local.get as jest.Mock;
const mockStorageSet = storage.local.set as jest.Mock;
const mockStorageRemove = storage.local.remove as jest.Mock;
const mockTabsQuery = tabs.query as jest.Mock;

const NOW = 1_700_000_000_000;
const FIVE_SECONDS = 5000;

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
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
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
    [ReturnType<typeof matchers.select.selector>, unknown]
  > = [
    [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
    [matchers.select.selector(selectVault), {} as never],
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
        [matchers.select.selector(selectVault), {} as never],
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

describe('updateVaultCipher debounce', () => {
  it('coalesces a burst of vault edits into a single re-encryption', async () => {
    const encryptSpy = jest
      .spyOn(vaultCryptoModule, 'encryptVault')
      .mockResolvedValue('cipher-blob');

    await expectSaga(vaultSagas)
      .provide([
        [matchers.select.selector(selectEncryptionKeyHash), 'key-hash'],
        [matchers.select.selector(selectVault), {} as never]
      ])
      .dispatch(accountRenamed({ oldName: 'a', newName: 'b' }))
      .dispatch(accountRenamed({ oldName: 'b', newName: 'c' }))
      .dispatch(accountRenamed({ oldName: 'c', newName: 'd' }))
      .silentRun(VAULT_REENCRYPT_DEBOUNCE_MS + 200);

    expect(encryptSpy).toHaveBeenCalledTimes(1);
  });
});
