import {
  debounce,
  put,
  select,
  takeEvery,
  takeLatest
} from 'redux-saga/effects';
import { storage } from 'webextension-polyfill';

import { LOGIN_RETRY_ATTEMPTS_LIMIT } from '@src/constants';
import { getActiveAccountSupports, getUrlOrigin } from '@src/utils';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue
} from '@popup/constants';

import { collectRequestIdsFromOpenWindows } from '@background/open-request-windows';
import {
  dismissSagaErrorsBySource,
  sagaError
} from '@background/redux/app-events/actions';
import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from '@background/redux/login-retry-lockout-time/actions';
import {
  selectHasLoginRetryLockoutTime,
  selectLoginRetryLockoutTime
} from '@background/redux/login-retry-lockout-time/selectors';
import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';
import { anchorServiceWorker } from '@background/sw-keep-alive-anchor';
import { emitSdkEventToActiveTabs } from '@background/utils';
import {
  deriveScryptKey,
  encodePasswordOffThread,
  verifyPasswordOffThread
} from '@background/workers/scrypt-off-thread';

import { sdkEvent } from '@content/sdk-event';

import { deriveKeyPair } from '@libs/crypto';
import { generateRandomSaltHex } from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { encryptVault } from '@libs/crypto/vault';

import { accountInfoReset } from '../account-info/actions';
import { keysUpdated } from '../keys/actions';
import { selectPasswordHash, selectPasswordSaltHash } from '../keys/selectors';
import { lastActivityTimeRefreshed } from '../last-activity-time/actions';
import { selectVaultLastActivityTime } from '../last-activity-time/selectors';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '../login-retry-count/actions';
import { selectLoginRetryCount } from '../login-retry-count/selectors';
import {
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';
import {
  selectEncryptionKeyHash,
  selectVaultIsLocked
} from '../session/selectors';
import { activeTimeoutDurationSettingChanged } from '../settings/actions';
import { selectTimeoutDurationSetting } from '../settings/selectors';
import { sagaCall, sagaSelect } from '../utils';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { selectVaultCipherDoesExist } from '../vault-cipher/selectors';
import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
  eip712PayloadReceived,
  hideAccountFromListChanged,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} from '../vault/actions';
import { findNextDerivedIndex } from '../vault/next-derived-index';
import {
  selectAccountNamesByOriginDict,
  selectSecretPhrase,
  selectVault,
  selectVaultActiveAccount,
  selectVaultDerivedAccounts
} from '../vault/selectors';
import {
  popupWindowInit,
  windowRequestResponded
} from '../windowManagement/actions';
import { selectOpenRequests } from '../windowManagement/selectors';
import {
  changePassword,
  createAccount,
  lockVault,
  startBackground,
  unlockVault
} from './actions';
import { errorToMessage } from './utils';

// Coalesce bursts of vault edits into a single re-encryption. 500ms is short
// enough to feel instant on the next lock/read yet absorbs rapid multi-field edits.
export const VAULT_REENCRYPT_DEBOUNCE_MS = 500;

export function* vaultSagas() {
  yield takeLatest(lockVault.type, lockVaultSaga);
  yield takeLatest(
    [loginRetryLockoutTimeSet.type, popupWindowInit.type, startBackground.type],
    setDelayForLockoutVaultSaga
  );
  // Registered after setDelayForLockoutVaultSaga: that takeLatest also watches
  // startBackground, so arming first would start a run it then cancels.
  yield takeEvery(
    [loginRetryCountIncremented.type, startBackground.type],
    armLockoutSaga
  );
  yield takeLatest(unlockVault.type, unlockVaultSaga);
  yield takeLatest(vaultLoaded.type, reconcileStalePayloadsSaga);
  yield takeLatest(
    [
      startBackground.type,
      lastActivityTimeRefreshed.type,
      activeTimeoutDurationSettingChanged.type
    ],
    timeoutCounterSaga
  );
  // Account mutations persist immediately: an imported secret key exists nowhere
  // else, so losing it to a crash inside the debounce window is unrecoverable.
  yield takeEvery(
    [
      accountAdded.type,
      accountsAdded.type,
      accountImported.type,
      accountsImported.type
    ],
    updateVaultCipher
  );
  // debounce does not cancel an in-flight run, so overlapping updateVaultCipher
  // runs stay FIFO only while encryptVault has no `await`.
  yield debounce(
    VAULT_REENCRYPT_DEBOUNCE_MS,
    [
      accountRemoved.type,
      accountRenamed.type,
      siteConnected.type,
      anotherAccountConnected.type,
      accountDisconnected.type,
      siteDisconnected.type,
      activeAccountChanged.type,
      activeTimeoutDurationSettingChanged.type,
      deployPayloadReceived.type,
      eip712PayloadReceived.type,
      // Dropping an answered request's payload is an in-memory edit; without a
      // re-encryption a service-worker restart resurrects it through `vaultLoaded`.
      windowRequestResponded.type,
      hideAccountFromListChanged.type
    ],
    updateVaultCipher
  );
  yield takeLatest(createAccount.type, createAccountSaga);
  yield takeLatest(changePassword.type, changePasswordSaga);
}

export function* lockVaultSaga() {
  try {
    // Flush a debounced-but-unpersisted vault edit while the session key and
    // vault are still live — the resets below wipe both.
    yield* updateVaultCipher();

    yield put(sessionReseted());
    yield put(vaultReseted());
    yield put(deploysReseted());
    yield put(accountInfoReset());

    emitSdkEventToActiveTabs(() => {
      return sdkEvent.lockedEvent({
        isLocked: true,
        isConnected: undefined,
        activeKey: undefined,
        activeKeySupports: undefined
      });
    });

    // The persisted deadline is spent; clearing it after the emit keeps a storage
    // rejection from stopping dapps seeing the lock.
    yield* sagaCall(clearAutoLockDeadline);
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'lockVaultSaga', message: errorToMessage(err) })
    );
  }
}

function isChangePasswordPayload(
  payload: unknown
): payload is ReturnType<typeof changePassword>['payload'] {
  const p = payload as Partial<ReturnType<typeof changePassword>['payload']>;

  // Length is checked here because this arrives over the privileged port, not the
  // form: an empty password would re-key the vault under scrypt('').
  return (
    typeof p?.currentPassword === 'string' &&
    typeof p?.password === 'string' &&
    p.password.length > 0
  );
}

// The re-key happens here, against the background's own state: a caller allowed to
// hand in `newEncryptionKeyHash` would choose the key `vaultCipher` is encrypted under.
export function* changePasswordSaga(action: ReturnType<typeof changePassword>) {
  // Errors are append-only and the banner is route-independent, so a previous
  // attempt's banner would otherwise outlive the retry that succeeded.
  yield put(dismissSagaErrorsBySource('changePasswordSaga'));

  const releaseAnchor = anchorServiceWorker('encrypt');

  try {
    // Validated inside the `try`: a throw above it escapes into `rootSaga`'s
    // boundary-less `all([...])` and cancels every watcher, auto-lock included.
    if (!isChangePasswordPayload(action.payload)) {
      throw Error('Malformed changePassword payload');
    }

    const { currentPassword, password } = action.payload;

    // Fail fast before burning three scrypt derivations on an already-locked
    // vault; the re-check after the encrypt covers the window either side.
    if (yield* sagaSelect(selectVaultIsLocked)) {
      yield put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the wallet locked. Try again.'
        })
      );
      return;
    }

    const storedPasswordHash = yield* sagaSelect(selectPasswordHash);
    const storedPasswordSaltHash = yield* sagaSelect(selectPasswordSaltHash);

    if (storedPasswordHash == null || storedPasswordSaltHash == null) {
      throw Error('No password is set');
    }

    const isCurrentPasswordCorrect = yield* sagaCall(() =>
      verifyPasswordOffThread(
        storedPasswordHash,
        storedPasswordSaltHash,
        currentPassword
      )
    );

    if (!isCurrentPasswordCorrect) {
      yield put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the current password is wrong.'
        })
      );
      return;
    }

    const passwordSaltHash = generateRandomSaltHex();
    const passwordHash = yield* sagaCall(() =>
      encodePasswordOffThread(password, passwordSaltHash)
    );
    const keyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyHash = convertBytesToHex(
      yield* sagaCall(() => deriveScryptKey(password, keyDerivationSaltHash))
    );

    // Encrypt BEFORE putting anything: new keys stored over an old-key cipher
    // leave a vault the next unlock rejects under both passwords.
    const vault = yield* sagaSelect(selectVault);
    const vaultCipher = yield* sagaCall(
      encryptVault,
      newEncryptionKeyHash,
      vault
    );

    // The crypto above takes seconds, long enough for a lock to land mid-flight:
    // a session key planted on a locked wallet re-arms the empty-vault overwrite.
    if (yield* sagaSelect(selectVaultIsLocked)) {
      yield put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the wallet locked. Try again.'
        })
      );
      return;
    }

    yield put(
      keysUpdated({ passwordHash, passwordSaltHash, keyDerivationSaltHash })
    );
    yield put(
      encryptionKeyHashCreated({ encryptionKeyHash: newEncryptionKeyHash })
    );
    yield put(vaultCipherCreated({ vaultCipher }));
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'changePasswordSaga', message: errorToMessage(err) })
    );
  } finally {
    releaseAnchor();
  }
}

/**
 * Promise-based delay used as a saga `call` effect. Exported so tests can match
 * `call(delay, ms)` and assert the residual without a real timer.
 */
export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Persisted so the reset timer can be re-armed with the residual after a restart.
const readLockoutDeadline = () =>
  storage.local.get(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY);
const writeLockoutDeadline = (deadline: number) =>
  storage.local.set({ [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: deadline });
const clearLockoutDeadline = () =>
  storage.local.remove(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY);

/**
 * Re-arms the login-retry lockout reset timer. Arming persists an absolute
 * `start + LOCK_VAULT_TIMEOUT` deadline; a resume reads it back and waits only the
 * residual, so the lockout survives the service worker being killed mid-lockout.
 */
export function* setDelayForLockoutVaultSaga(
  action: ReturnType<
    | typeof loginRetryLockoutTimeSet
    | typeof startBackground
    | typeof popupWindowInit
  >
) {
  const loginRetryLockoutTime: number | null = yield select(
    selectLoginRetryLockoutTime
  );

  if (loginRetryLockoutTime == null) {
    yield* sagaCall(clearLockoutDeadline);
    return;
  }

  let deadline: number;

  if (action.type === loginRetryLockoutTimeSet.type) {
    deadline = loginRetryLockoutTime + LOCK_VAULT_TIMEOUT;
    yield* sagaCall(writeLockoutDeadline, deadline);
  } else {
    // Anything but a finite number (missing key, corrupted storage) recomputes
    // from the lockout start — never fail open into an immediate reset.
    const stored = yield* sagaCall(readLockoutDeadline);
    const raw = stored[LOGIN_RETRY_LOCKOUT_DEADLINE_KEY];
    deadline =
      typeof raw === 'number' && Number.isFinite(raw)
        ? raw
        : loginRetryLockoutTime + LOCK_VAULT_TIMEOUT;
  }

  const timeLeft = deadline - Date.now();

  if (timeLeft > 0) {
    yield* sagaCall(delay, timeLeft);
  }

  yield put(loginRetryCountReseted());
  yield put(loginRetryLockoutTimeReseted());
  yield* sagaCall(clearLockoutDeadline);
}

/**
 * Arms the login-retry lockout in the background, so it cannot be skipped by a
 * dropped UI dispatch. Runs on every increment and on resume, which also
 * reconciles a persisted count that passed the limit while nothing armed it.
 */
export function* armLockoutSaga() {
  const loginRetryCount = yield* sagaSelect(selectLoginRetryCount);

  if (loginRetryCount < LOGIN_RETRY_ATTEMPTS_LIMIT) {
    return;
  }

  // Not just a burst guard: without it a resume would restart the lockout clock.
  if (yield* sagaSelect(selectHasLoginRetryLockoutTime)) {
    return;
  }

  yield put(loginRetryLockoutTimeSet(Date.now()));

  if (!(yield* sagaSelect(selectVaultIsLocked))) {
    yield put(lockVault());
  }
}

/**
 * Reclaim the capped payload slots (`MAX_STORED_PAYLOADS`) that no live request can
 * answer for: an auto-lock persists an unanswered payload and `vaultLoaded` restores
 * it on the next unlock. Reuses `windowRequestResponded` because it is already in
 * the re-encrypt debounce list, which is how the deletion reaches the cipher.
 */
export function* reconcileStalePayloadsSaga() {
  try {
    // Sound as a pre-await read because it only decides whether to do nothing at
    // all — never reuse it for the purge decision.
    const payloadsAtEntry = yield* sagaSelect(selectVault);

    if (
      Object.keys(payloadsAtEntry.jsonById).length === 0 &&
      Object.keys(payloadsAtEntry.eip712ById).length === 0
    ) {
      return;
    }

    // `null` is a failed enumeration, not "no window displays a request". Fail
    // closed: purging on no evidence strands a live request.
    const liveIdsFromWindows = yield* sagaCall(
      collectRequestIdsFromOpenWindows
    );

    if (liveIdsFromWindows == null) {
      return;
    }

    // Re-read after the await: a keep-set computed before it is already stale.
    const openRequests = yield* sagaSelect(selectOpenRequests);
    const vault = yield* sagaSelect(selectVault);

    // Both halves are needed: descriptors can be gone while the window still shows
    // its `?requestId=`, and a reused window reports the previous request's URL.
    const keep = new Set(liveIdsFromWindows);

    for (const { requestId } of openRequests) {
      keep.add(requestId);
    }

    const orphans = new Set<string>();

    for (const requestId of [
      ...Object.keys(vault.jsonById),
      ...Object.keys(vault.eip712ById)
    ]) {
      if (!keep.has(requestId)) {
        orphans.add(requestId);
      }
    }

    if (orphans.size === 0) {
      return;
    }

    // Ids and counts only — no URL, window or tab may be logged: a `signMessage`
    // approval URL carries the user's plaintext message as a search param.
    console.warn('reconcileStalePayloadsSaga: reclaiming stale payload slots', {
      reclaimed: [...orphans],
      keptCount: keep.size
    });

    for (const requestId of orphans) {
      yield put(windowRequestResponded({ requestId }));
    }
  } catch (err) {
    // An escaping throw aborts every saga in `root-saga.ts`'s bare `all([...])`.
    // The message is fixed: nothing from a window URL may reach the banner.
    console.error('reconcileStalePayloadsSaga: failed', errorToMessage(err));
    yield put(
      sagaError({
        source: 'reconcileStalePayloadsSaga',
        message: 'Could not reclaim stored signing payloads'
      })
    );
  }
}

export function* unlockVaultSaga(action: ReturnType<typeof unlockVault>) {
  const releaseAnchor = anchorServiceWorker('unlock');

  try {
    // Append-only errors + a route-independent banner mean a refused attempt's
    // banner would otherwise outlive the retry that succeeds.
    yield put(dismissSagaErrorsBySource('unlockVaultSaga'));

    // Defence in depth: a dropped `loginRetryLockoutTimeSet` leaves this selector
    // null, so this catches only the forged-`unlockVault` path.
    if (yield* sagaSelect(selectHasLoginRetryLockoutTime)) {
      yield put(
        sagaError({
          source: 'unlockVaultSaga',
          message: 'Too many failed attempts. Wait before unlocking again.'
        })
      );
      return;
    }

    const {
      vault,
      newKeyDerivationSaltHash,
      newVaultCipher,
      newEncryptionKeyHash
    } = action.payload;

    yield put(loginRetryCountReseted());
    yield put(vaultLoaded(vault));
    yield put(
      keysUpdated({
        keyDerivationSaltHash: newKeyDerivationSaltHash
      })
    );
    yield put(
      vaultCipherCreated({
        vaultCipher: newVaultCipher
      })
    );
    yield put(
      encryptionKeyHashCreated({ encryptionKeyHash: newEncryptionKeyHash })
    );
    yield put(vaultUnlocked());

    const accountNamesByOriginDict = yield* sagaSelect(
      selectAccountNamesByOriginDict
    );

    const isActiveAccountConnectedWith = (origin: string | undefined) => {
      const accountNames = origin && accountNamesByOriginDict[origin];
      if (accountNames == null) {
        return false;
      }
      return accountNames.includes(activeAccount?.name || '');
    };

    const activeAccount = yield* sagaSelect(selectVaultActiveAccount);

    if (activeAccount) {
      emitSdkEventToActiveTabs(tab => {
        if (!tab.url) {
          return;
        }

        const isActiveAccountConnectedWithTab = isActiveAccountConnectedWith(
          getUrlOrigin(tab.url)
        );

        return sdkEvent.unlockedEvent({
          isLocked: false,
          isConnected: isActiveAccountConnectedWithTab,
          activeKey: isActiveAccountConnectedWithTab
            ? activeAccount.publicKey
            : undefined,
          activeKeySupports: isActiveAccountConnectedWithTab
            ? getActiveAccountSupports(activeAccount)
            : undefined
        });
      });
    }
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'unlockVaultSaga', message: errorToMessage(err) })
    );
  } finally {
    releaseAnchor();
  }
}

// Persisted so the inactivity timer can be re-armed with the residual after a restart.
const readAutoLockDeadline = () => storage.local.get(AUTO_LOCK_DEADLINE_KEY);
const writeAutoLockDeadline = (deadline: number) =>
  storage.local.set({ [AUTO_LOCK_DEADLINE_KEY]: deadline });
const clearAutoLockDeadline = () =>
  storage.local.remove(AUTO_LOCK_DEADLINE_KEY);

/**
 * Locks the vault once the inactivity timeout elapses. Arming persists an absolute
 * `lastActivity + timeout` deadline; a resume reads it back and waits only the
 * residual, so the timer survives the service worker being killed.
 */
export function* timeoutCounterSaga(
  action: ReturnType<
    | typeof startBackground
    | typeof lastActivityTimeRefreshed
    | typeof activeTimeoutDurationSettingChanged
  >
) {
  try {
    const vaultDoesExist = yield* sagaSelect(selectVaultCipherDoesExist);
    const vaultIsLocked = yield* sagaSelect(selectVaultIsLocked);
    const vaultLastActivityTime = yield* sagaSelect(
      selectVaultLastActivityTime
    );
    const vaultTimeoutDurationSetting = yield* sagaSelect(
      selectTimeoutDurationSetting
    );
    const timeoutDurationValue =
      MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

    if (vaultDoesExist && !vaultIsLocked && vaultLastActivityTime) {
      let deadline: number;

      if (action.type === startBackground.type) {
        // Anything but a finite number (missing key, corrupted storage) recomputes
        // from the last activity time.
        const stored = yield* sagaCall(readAutoLockDeadline);
        const raw = stored[AUTO_LOCK_DEADLINE_KEY];
        deadline =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : vaultLastActivityTime + timeoutDurationValue;
      } else {
        deadline = vaultLastActivityTime + timeoutDurationValue;
        yield* sagaCall(writeAutoLockDeadline, deadline);
      }

      const timeLeft = deadline - Date.now();

      if (timeLeft > 0) {
        yield* sagaCall(delay, timeLeft);
      }

      yield put(lockVault());
    } else {
      // The `lockVault` path that clears the persisted deadline never ran in this
      // worker, so drop a stale value here rather than let it fire later.
      yield* sagaCall(clearAutoLockDeadline);
    }
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'timeoutCounterSaga', message: errorToMessage(err) })
    );
  }
}

function* updateVaultCipher() {
  const releaseAnchor = anchorServiceWorker('encrypt');

  try {
    const encryptionKeyHash = yield* sagaSelect(selectEncryptionKeyHash);

    // A debounced straggler lands here after a lock with a null key: returning
    // early keeps it off the error banner and off the cipher the flush persisted.
    if (encryptionKeyHash == null) {
      return;
    }

    const vault = yield* sagaSelect(selectVault);

    const vaultCipher = yield* sagaCall(encryptVault, encryptionKeyHash, vault);

    yield put(
      vaultCipherCreated({
        vaultCipher
      })
    );
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'updateVaultCipher', message: errorToMessage(err) })
    );
  } finally {
    releaseAnchor();
  }
}

function* createAccountSaga(action: ReturnType<typeof createAccount>) {
  const releaseAnchor = anchorServiceWorker('create-account');

  try {
    const { name } = action.payload;

    if (name == null) {
      throw Error('Account name missing');
    }

    const derivedAccounts = yield* sagaSelect(selectVaultDerivedAccounts);

    if (derivedAccounts.find(a => a.name === name)) {
      throw Error('Account name exist');
    }

    const secretPhrase = yield* sagaSelect(selectSecretPhrase);
    const index = findNextDerivedIndex(secretPhrase, derivedAccounts);
    const keyPair = deriveKeyPair(secretPhrase, index);

    yield put(
      accountAdded({ ...keyPair, name, hidden: false, derivationIndex: index })
    );
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'createAccountSaga', message: errorToMessage(err) })
    );
  } finally {
    releaseAnchor();
  }
}
