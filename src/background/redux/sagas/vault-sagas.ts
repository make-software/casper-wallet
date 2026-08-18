import { debounce, put, select, takeLatest } from 'redux-saga/effects';
import { storage } from 'webextension-polyfill';

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
import { selectLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';
import { anchorServiceWorker } from '@background/sw-keep-alive-anchor';
import { emitSdkEventToActiveTabs } from '@background/utils';

import { sdkEvent } from '@content/sdk-event';

import { deriveKeyPair } from '@libs/crypto';
import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex,
  verifyPasswordAgainstHash
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { encryptVault } from '@libs/crypto/vault';
import { Account } from '@libs/types/account';

import { accountInfoReset } from '../account-info/actions';
import { keysUpdated } from '../keys/actions';
import { selectPasswordHash, selectPasswordSaltHash } from '../keys/selectors';
import { lastActivityTimeRefreshed } from '../last-activity-time/actions';
import { selectVaultLastActivityTime } from '../last-activity-time/selectors';
import { loginRetryCountReseted } from '../login-retry-count/actions';
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
  // Unlike takeLatest, debounce does not cancel an in-flight run when the next
  // trigger arrives, so two updateVaultCipher runs could overlap and the staler
  // cipher win. This relies on the invariant that a single encryption
  // (~2ms measured, even on a 50-account vault) stays far below the 500ms
  // debounce window — keep that true if the vault or crypto grows.
  yield debounce(
    VAULT_REENCRYPT_DEBOUNCE_MS,
    [
      accountAdded.type,
      accountsAdded.type,
      accountImported.type,
      accountsImported.type,
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
      // The deletion belongs here for the same reason the two writes above do.
      // The vault reducer drops an answered request's payload from
      // `jsonById`/`eip712ById`, but that is an in-memory edit: without a
      // re-encryption the cipher still holds the entry, and an MV3
      // service-worker restart before the next vault write would resurrect it
      // through `vaultLoaded` — for a requestId `windowRequestResponded` has
      // already fired for — and nothing removes it: the map has a ceiling, but
      // the ceiling refuses new writes rather than evicting stored ones.
      // Most responses have no payload entry, so this usually re-encrypts an
      // unchanged vault; at ~2ms behind a 500ms debounce that is cheaper than
      // the alternative of persisting writes but not deletes.
      windowRequestResponded.type,
      hideAccountFromListChanged.type
    ],
    updateVaultCipher
  );
  yield takeLatest(createAccount.type, createAccountSaga);
  yield takeLatest(changePassword.type, changePasswordSaga);
}

/**
 * on lock destroy session, vault and deploys
 */
export function* lockVaultSaga() {
  try {
    // Flush any debounced-but-not-yet-persisted vault change before teardown.
    // updateVaultCipher now runs on debounce(500ms); a vault edit in the last
    // 500ms before lock would otherwise never be encrypted. Reusing
    // updateVaultCipher keeps the ciphertext path (and blob format) identical.
    // It reads the still-live encryptionKeyHash + vault; the resets below wipe
    // both. A stale debounced straggler that fires ~500ms later runs against the
    // reset session (encryptionKeyHash === null), where updateVaultCipher
    // early-returns — so it can never overwrite this flushed cipher.
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

    // The vault is locked, so the persisted auto-lock deadline is spent —
    // remove it so a stale value can never fire against a future session.
    // `timeoutCounterSaga` locks by dispatching this same `lockVault` action,
    // so this single site covers both the timeout and manual-lock paths.
    // Sequenced AFTER the emit: this is the only fallible step in the saga,
    // and a storage rejection must not prevent dapps from seeing the lock.
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

  // Non-empty, not just a string: the form enforces a minimum length, but this
  // action does not come from the form on the forwarded path, and an empty one
  // would re-key the vault under scrypt('').
  return (
    typeof p?.currentPassword === 'string' &&
    typeof p?.password === 'string' &&
    p.password.length > 0
  );
}

// Both halves of the re-key happen here, against the background's own state:
// the current password is verified, and the new material is derived from a
// plaintext password exactly as `initKeysSage` does it. This action rides the
// sender-ungated forwarded path, so a caller that could hand in
// `newEncryptionKeyHash` would be choosing the key the vault is re-encrypted
// under — and `fetchPrivateState` hands `vaultCipher` to any extension page,
// which makes a chosen key an offline decrypt. Verifying page-side only is not
// enough either: the page-side check reads `passwordHash` from that same
// handler, so it is replayable, while the plaintext password demanded here is
// not derivable from anything an extension page can read.
// `scryptAsync` yields to the event loop between blocks, so the three
// derivations do not wedge the worker the way synchronous ones would.
export function* changePasswordSaga(action: ReturnType<typeof changePassword>) {
  // Errors are append-only and SagaErrorBanner is mounted route-independently,
  // so without this a previous attempt's "the wallet locked" banner outlives
  // the retry that succeeded.
  yield put(dismissSagaErrorsBySource('changePasswordSaga'));

  // Keep the MV3 service worker alive while the vault is re-encrypted —
  // Chrome may otherwise kill it mid-saga during the heavy crypto work.
  const releaseAnchor = anchorServiceWorker('encrypt');

  try {
    // Validated inside the `try`, and destructured only after: this action
    // rides the sender-ungated forwarded path, so `{ type }` with no payload
    // reaches `store.dispatch` unchanged, and a destructure above would throw
    // past every catch here into `rootSaga`'s boundary-less `all([...])`,
    // cancelling every watcher in the tree — auto-lock included.
    if (!isChangePasswordPayload(action.payload)) {
      throw Error('Malformed changePassword payload');
    }

    const { currentPassword, password } = action.payload;

    // Fail fast before burning three scrypt derivations on a vault that is
    // already locked. The window either side of them is covered by the
    // re-check after the encrypt below.
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
      verifyPasswordAgainstHash(
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
      encodePassword(password, passwordSaltHash)
    );
    const keyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyHash = convertBytesToHex(
      yield* sagaCall(() =>
        deriveEncryptionKey(password, keyDerivationSaltHash)
      )
    );

    // Encrypt BEFORE putting anything: if this throws, nothing has been
    // persisted yet and the old password stays fully intact. The alternative
    // order — store the new keys, then encrypt — leaves new keys over an
    // old-key cipher on failure, which the next unlock rejects under BOTH the
    // old and the new password.
    const vault = yield* sagaSelect(selectVault);
    const vaultCipher = yield* sagaCall(
      encryptVault,
      newEncryptionKeyHash,
      vault
    );

    // The derivation and encrypt above take seconds — long enough for a manual
    // lock, an idle timeout or a service-worker restart to land mid-flight. By
    // then `lockVaultSaga` has emptied the vault, and `encryptionKeyHashCreated`
    // does not clear `isLocked`. Re-check rather than trust the pre-check: without this,
    // a locked wallet would get a new session key planted on it, re-arming the
    // exact empty-vault-overwrite hazard the pre-check exists to prevent.
    if (yield* sagaSelect(selectVaultIsLocked)) {
      yield put(
        sagaError({
          source: 'changePasswordSaga',
          message: 'Password was not changed: the wallet locked. Try again.'
        })
      );
      return;
    }

    // The remaining window is storage-write ordering between these three puts,
    // not the crypto — the cipher already exists under the new key by now.
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
 * `call(delay, ms)` and assert the exact residual without a real timer.
 */
export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Absolute login-retry lockout deadline persisted to `storage.local` so the
// reset timer can be re-armed with the residual after a service-worker restart.
const readLockoutDeadline = () =>
  storage.local.get(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY);
const writeLockoutDeadline = (deadline: number) =>
  storage.local.set({ [LOGIN_RETRY_LOCKOUT_DEADLINE_KEY]: deadline });
const clearLockoutDeadline = () =>
  storage.local.remove(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY);

/**
 * Re-arms the login-retry lockout reset timer.
 *
 * Triggered when a lockout is set (`loginRetryLockoutTimeSet`) and on resume
 * points (`startBackground` after an MV3 service-worker restart, `popupWindowInit`).
 *
 * On arming we persist an absolute `start + LOCK_VAULT_TIMEOUT` deadline to
 * `storage.local`; on resume we read that deadline back and wait only the
 * residual (`deadline - now`), or reset immediately if it already elapsed. This
 * survives the service worker being killed mid-lockout.
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
    // No active lockout — drop any stale persisted deadline and stop.
    yield* sagaCall(clearLockoutDeadline);
    return;
  }

  let deadline: number;

  if (action.type === loginRetryLockoutTimeSet.type) {
    // Arming: compute and persist the absolute deadline.
    deadline = loginRetryLockoutTime + LOCK_VAULT_TIMEOUT;
    yield* sagaCall(writeLockoutDeadline, deadline);
  } else {
    // Resume: read the persisted deadline. Anything but a finite number
    // (missing key, corrupted storage) falls back to recomputing from the
    // lockout start time — never fail open into an immediate lockout reset.
    const stored = yield* sagaCall(readLockoutDeadline);
    const raw = stored[LOGIN_RETRY_LOCKOUT_DEADLINE_KEY];
    deadline =
      typeof raw === 'number' && Number.isFinite(raw)
        ? raw
        : loginRetryLockoutTime + LOCK_VAULT_TIMEOUT;
  }

  const timeLeft = deadline - Date.now();

  // Wait out only the residual; if it already elapsed we fall straight through
  // to the reset below.
  if (timeLeft > 0) {
    yield* sagaCall(delay, timeLeft);
  }

  yield put(loginRetryCountReseted());
  yield put(loginRetryLockoutTimeReseted());
  yield* sagaCall(clearLockoutDeadline);
}

/**
 * Reclaim the capped payload slots (`MAX_STORED_PAYLOADS`) that no live request
 * can answer for. A plain auto-lock is enough to strand one: `lockVaultSaga`
 * flushes `updateVaultCipher` BEFORE the resets, so an unanswered payload is
 * persisted, the later `windowRequestResponded` finds an emptied in-memory map,
 * and `vaultLoaded` restores the entry on the next unlock.
 *
 * `windowRequestResponded` is reused rather than a new action added because it
 * is already in the re-encrypt debounce list above, which is how the deletion
 * reaches the cipher rather than living in memory until the next restart.
 */
export function* reconcileStalePayloadsSaga() {
  try {
    // Nothing stored, nothing to reclaim: skip the round trip over every tab
    // URL. Sound as a pre-await read because it only decides whether to do
    // nothing at all — never reuse it for the purge decision.
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

    // Both halves are needed. After a service-worker restart the descriptors
    // are gone while the window still shows its `?requestId=`; on window reuse
    // a live window still reports the previous request's URL mid-navigation.
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
    // `root-saga.ts` is a bare `all([...])` with no `onError`, so an escaping
    // throw aborts every saga — auto-lock and cipher persistence included. The
    // reported message is fixed: nothing from a window URL may reach the banner.
    console.error('reconcileStalePayloadsSaga: failed', errorToMessage(err));
    yield put(
      sagaError({
        source: 'reconcileStalePayloadsSaga',
        message: 'Could not reclaim stored signing payloads'
      })
    );
  }
}

/**
 * on unlock decrypt stored vault from cipher
 * generate a new encryption key each login and update existing cipher (collisions0
 * put new encryption key in session
 */
export function* unlockVaultSaga(action: ReturnType<typeof unlockVault>) {
  // Keep the MV3 service worker alive for the whole unlock flow — Chrome may
  // otherwise kill it mid-saga during the heavy crypto work.
  const releaseAnchor = anchorServiceWorker('unlock');

  try {
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

// Absolute auto-lock deadline persisted to `storage.local` so the inactivity
// timer can be re-armed with the residual after a service-worker restart.
const readAutoLockDeadline = () => storage.local.get(AUTO_LOCK_DEADLINE_KEY);
const writeAutoLockDeadline = (deadline: number) =>
  storage.local.set({ [AUTO_LOCK_DEADLINE_KEY]: deadline });
const clearAutoLockDeadline = () =>
  storage.local.remove(AUTO_LOCK_DEADLINE_KEY);

/**
 * Saga to handle the timeout and locking mechanism of a vault based on its last
 * activity time and a specified timeout duration setting.
 *
 * On arming (`lastActivityTimeRefreshed` / `activeTimeoutDurationSettingChanged`)
 * it computes an absolute `lastActivity + timeout` deadline and persists it to
 * `storage.local`. On resume (`startBackground` after an MV3 service-worker
 * restart) it reads that deadline back instead of recomputing. Either way it
 * locks immediately if the deadline already elapsed, otherwise it waits only the
 * residual (`deadline - now`) before locking. Persisting the absolute deadline is
 * what lets the timer survive the service worker being killed.
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
        // Resume: read the persisted deadline. Anything but a finite number
        // (missing key, corrupted storage) falls back to recomputing from the
        // last activity time — same validation as the lockout saga.
        const stored = yield* sagaCall(readAutoLockDeadline);
        const raw = stored[AUTO_LOCK_DEADLINE_KEY];
        deadline =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : vaultLastActivityTime + timeoutDurationValue;
      } else {
        // Arming: compute and persist the absolute deadline.
        deadline = vaultLastActivityTime + timeoutDurationValue;
        yield* sagaCall(writeAutoLockDeadline, deadline);
      }

      const timeLeft = deadline - Date.now();

      if (timeLeft > 0) {
        yield* sagaCall(delay, timeLeft);
      }

      yield put(lockVault());
    } else {
      // Locked (or no session) — e.g. a cold start where the session slice was
      // lost. The `lockVault` path that normally clears the persisted deadline
      // never ran in this worker, so drop any stale value here to keep it from
      // ever firing against a future session.
      yield* sagaCall(clearAutoLockDeadline);
    }
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'timeoutCounterSaga', message: errorToMessage(err) })
    );
  }
}

/**
 * update vault cipher on each vault update
 */
function* updateVaultCipher() {
  // Keep the MV3 service worker alive while the vault is re-encrypted —
  // Chrome may otherwise kill it mid-saga during the heavy crypto work.
  const releaseAnchor = anchorServiceWorker('encrypt');

  try {
    // get current encryption key
    const encryptionKeyHash = yield* sagaSelect(selectEncryptionKeyHash);

    // A locked / session-less state is not an error — there is simply nothing to
    // persist. This is the debounced-straggler case: a trigger fired within
    // 500ms before a lock re-arms the debounce, then `lockVaultSaga` wipes the
    // session key, and the trailing run lands here with a null key. Returning
    // early keeps it out of the `sagaError` → UI-banner channel, so a routine
    // "edit then lock" never surfaces a spurious "Encryption key doesn't exist"
    // toast. It also means the straggler can never overwrite the cipher the
    // lock flush already persisted.
    if (encryptionKeyHash == null) {
      return;
    }

    // encrypt cipher with the new key
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

/**
 *
 */
function* createAccountSaga(action: ReturnType<typeof createAccount>) {
  // Keep the MV3 service worker alive during key derivation — Chrome may
  // otherwise kill it mid-saga during the heavy crypto work.
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

    let isAccountAlreadyAdded = true;
    let i = 0;

    const secretPhrase = yield* sagaSelect(selectSecretPhrase);

    while (isAccountAlreadyAdded) {
      const keyPair = deriveKeyPair(secretPhrase, i);
      if (
        !derivedAccounts.some(
          account => account.publicKey === keyPair.publicKey
        )
      ) {
        isAccountAlreadyAdded = false;

        const account: Account = {
          ...keyPair,
          name,
          hidden: false,
          derivationIndex: i
        };
        yield put(accountAdded(account));
        break;
      }
      i++;
    }
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'createAccountSaga', message: errorToMessage(err) })
    );
  } finally {
    releaseAnchor();
  }
}
