import { put, select, takeLatest } from 'redux-saga/effects';
import { storage } from 'webextension-polyfill';

import { getActiveAccountSupports, getUrlOrigin } from '@src/utils';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue
} from '@popup/constants';

import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/get-main-store';
import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from '@background/redux/login-retry-lockout-time/actions';
import { selectLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import { emitSdkEventToActiveTabs } from '@background/utils';

import { sdkEvent } from '@content/sdk-event';

import { deriveKeyPair } from '@libs/crypto';
import { encryptVault } from '@libs/crypto/vault';
import { Account } from '@libs/types/account';

import { accountInfoReset } from '../account-info/actions';
import { keysUpdated } from '../keys/actions';
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
import { popupWindowInit } from '../windowManagement/actions';
import {
  createAccount,
  lockVault,
  startBackground,
  unlockVault
} from './actions';

export function* vaultSagas() {
  yield takeLatest(lockVault.type, lockVaultSaga);
  yield takeLatest(
    [loginRetryLockoutTimeSet.type, popupWindowInit.type, startBackground.type],
    setDelayForLockoutVaultSaga
  );
  yield takeLatest(unlockVault.type, unlockVaultSaga);
  yield takeLatest(
    [
      startBackground.type,
      lastActivityTimeRefreshed.type,
      activeTimeoutDurationSettingChanged.type
    ],
    timeoutCounterSaga
  );
  yield takeLatest(
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
      hideAccountFromListChanged.type
    ],
    updateVaultCipher
  );
  yield takeLatest(createAccount.type, createAccountSaga);
}

/**
 * on lock destroy session, vault and deploys
 */
export function* lockVaultSaga() {
  try {
    yield put(sessionReseted());
    yield put(vaultReseted());
    yield put(deploysReseted());
    yield put(accountInfoReset());

    // The vault is locked, so the persisted auto-lock deadline is spent —
    // remove it so a stale value can never fire against a future session.
    // `timeoutCounterSaga` locks by dispatching this same `lockVault` action,
    // so this single site covers both the timeout and manual-lock paths.
    yield* sagaCall(clearAutoLockDeadline);

    emitSdkEventToActiveTabs(() => {
      return sdkEvent.lockedEvent({
        isLocked: true,
        isConnected: undefined,
        activeKey: undefined,
        activeKeySupports: undefined
      });
    });
  } catch (err) {
    console.error(err);
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
    // Resume: read the persisted deadline, falling back to a computed one.
    const stored = yield* sagaCall(readLockoutDeadline);
    deadline =
      (stored[LOGIN_RETRY_LOCKOUT_DEADLINE_KEY] as number | undefined) ??
      loginRetryLockoutTime + LOCK_VAULT_TIMEOUT;
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
 * on unlock decrypt stored vault from cipher
 * generate a new encryption key each login and update existing cipher (collisions0
 * put new encryption key in session
 */
function* unlockVaultSaga(action: ReturnType<typeof unlockVault>) {
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
        // Resume: read the persisted deadline, falling back to a computed one.
        const stored = yield* sagaCall(readAutoLockDeadline);
        deadline =
          (stored[AUTO_LOCK_DEADLINE_KEY] as number | undefined) ??
          vaultLastActivityTime + timeoutDurationValue;
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
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 * update vault cipher on each vault update
 */
function* updateVaultCipher() {
  try {
    // get current encryption key
    const encryptionKeyHash = yield* sagaSelect(selectEncryptionKeyHash);
    // encrypt cipher with the new key
    const vault = yield* sagaSelect(selectVault);

    const vaultCipher = yield* sagaCall(() =>
      encryptVault(encryptionKeyHash, vault)
    );

    yield put(
      vaultCipherCreated({
        vaultCipher
      })
    );
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 */
function* createAccountSaga(action: ReturnType<typeof createAccount>) {
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
  }
}
