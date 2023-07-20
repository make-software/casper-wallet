import { put, select, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { deriveKeyPair } from '@src/libs/crypto';
import { encryptVault } from '@src/libs/crypto/vault';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue
} from '@src/apps/popup/constants';
import { sdkEvent } from '@src/content/sdk-event';
import { emitSdkEventToActiveTabs } from '@src/background/utils';
import { selectLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from '@background/redux/login-retry-lockout-time/actions';

import {
  selectEncryptionKeyHash,
  selectVaultIsLocked
} from '../session/selectors';
import { sagaCall, sagaSelect } from '../utils';
import {
  accountAdded,
  accountImported,
  accountRenamed,
  accountRemoved,
  siteConnected,
  accountDisconnected,
  siteDisconnected,
  activeAccountChanged,
  vaultLoaded,
  vaultReseted,
  anotherAccountConnected,
  deployPayloadReceived
} from '../vault/actions';
import {
  selectSecretPhrase,
  selectVault,
  selectAccountNamesByOriginDict,
  selectVaultActiveAccount,
  selectVaultDerivedAccounts
} from '../vault/selectors';
import {
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';
import { selectVaultCipherDoesExist } from '../vault-cipher/selectors';
import { keysUpdated } from '../keys/actions';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { deploysReseted } from '../vault/actions';
import { loginRetryCountReseted } from '../login-retry-count/actions';
import { popupWindowInit } from '../windowManagement/actions';

import {
  createAccount,
  lockVault,
  startBackground,
  unlockVault
} from './actions';
import { lastActivityTimeRefreshed } from '../last-activity-time/actions';
import { selectVaultLastActivityTime } from '../last-activity-time/selectors';
import { activeTimeoutDurationSettingChanged } from '../settings/actions';
import { selectTimeoutDurationSetting } from '../settings/selectors';
import { getUrlOrigin } from '@src/utils';
import { accountActivityReset } from '../account-info/actions';

export function* vaultSagas() {
  yield takeLatest(getType(lockVault), lockVaultSaga);
  yield takeLatest(
    [getType(loginRetryLockoutTimeSet), getType(popupWindowInit)],
    setDelayForLockoutVaultSaga
  );
  yield takeLatest(getType(unlockVault), unlockVaultSaga);
  yield takeLatest(
    [
      getType(startBackground),
      getType(lastActivityTimeRefreshed),
      getType(activeTimeoutDurationSettingChanged)
    ],
    timeoutCounterSaga
  );
  yield takeLatest(
    [
      getType(accountAdded),
      getType(accountImported),
      getType(accountRemoved),
      getType(accountRenamed),
      getType(siteConnected),
      getType(anotherAccountConnected),
      getType(accountDisconnected),
      getType(siteDisconnected),
      getType(activeAccountChanged),
      getType(activeTimeoutDurationSettingChanged),
      getType(deployPayloadReceived)
    ],
    updateVaultCipher
  );
  yield takeLatest(getType(createAccount), createAccountSaga);
}

/**
 * on lock destroy session, vault and deploys
 */
function* lockVaultSaga(action: ReturnType<typeof lockVault>) {
  try {
    yield put(sessionReseted());
    yield put(vaultReseted());
    yield put(deploysReseted());
    yield put(accountActivityReset());

    emitSdkEventToActiveTabs(tab => {
      return sdkEvent.lockedEvent({
        isLocked: true,
        isConnected: undefined,
        activeKey: undefined
      });
    });
  } catch (err) {
    console.error(err);
  }
}

function* setDelayForLockoutVaultSaga() {
  const loginRetryLockoutTime: number | null = yield select(
    selectLoginRetryLockoutTime
  );

  if (loginRetryLockoutTime == null) {
    return;
  }

  const currentTime = Date.now();
  const isTimeoutExpired =
    currentTime - loginRetryLockoutTime >= LOCK_VAULT_TIMEOUT;

  //  if the timeout expired we reset the count and lockout time
  if (isTimeoutExpired) {
    yield put(loginRetryCountReseted());
    yield put(loginRetryLockoutTimeReseted());
  }

  //  if the timeout has not expired we set the timer with the time that is left
  if (!isTimeoutExpired) {
    const timeLeft = LOCK_VAULT_TIMEOUT - (currentTime - loginRetryLockoutTime);
    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));

    yield* sagaCall(delay, timeLeft);

    yield put(loginRetryCountReseted());
    yield put(loginRetryLockoutTimeReseted());
  }
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
    console.log('unlockVaultSaga');
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
            : undefined
        });
      });
    }
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 */
function* timeoutCounterSaga(action: any) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      const currentTime = Date.now();
      const timeoutExpired =
        currentTime - vaultLastActivityTime >= timeoutDurationValue;

      if (timeoutExpired) {
        yield put(lockVault());
      } else {
        yield* sagaCall(delay, timeoutDurationValue);
        yield put(lockVault());
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    //
  }
}

/**
 * update vault cipher on each vault update
 */
function* updateVaultCipher(action: any) {
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

    const accountCount = derivedAccounts.length;
    const secretPhrase = yield* sagaSelect(selectSecretPhrase);

    const keyPair = deriveKeyPair(secretPhrase, accountCount);
    const account = {
      ...keyPair,
      name
    };

    yield put(accountAdded(account));
  } catch (err) {
    console.error(err);
  }
}
