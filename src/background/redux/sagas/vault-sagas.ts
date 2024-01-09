import { put, select, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { getUrlOrigin } from '@src/utils';

import {
  LOCK_VAULT_TIMEOUT,
  MapTimeoutDurationSettingToValue
} from '@popup/constants';

import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from '@background/redux/login-retry-lockout-time/actions';
import { selectLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import { emitSdkEventToActiveTabs } from '@background/utils';

import { sdkEvent } from '@content/sdk-event';

import { deriveKeyPair } from '@libs/crypto';
import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { encryptVault } from '@libs/crypto/vault';

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
  activeAccountChanged,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
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
  changePassword,
  createAccount,
  lockVault,
  startBackground,
  unlockVault
} from './actions';

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
  yield takeLatest(getType(changePassword), changePasswordSaga);
}

/**
 * on lock destroy session, vault and deploys
 */
function* lockVaultSaga() {
  try {
    yield put(sessionReseted());
    yield put(vaultReseted());
    yield put(deploysReseted());
    yield put(accountInfoReset());

    emitSdkEventToActiveTabs(() => {
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
function* timeoutCounterSaga() {
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

function* changePasswordSaga(action: ReturnType<typeof changePassword>) {
  try {
    const { password } = action.payload;

    const passwordSaltHash = generateRandomSaltHex();
    const passwordHash = yield* sagaCall(() =>
      encodePassword(password, passwordSaltHash)
    );
    const keyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyBytes = yield* sagaCall(() =>
      deriveEncryptionKey(password, keyDerivationSaltHash)
    );
    const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);

    yield put(
      keysUpdated({
        passwordHash,
        passwordSaltHash,
        keyDerivationSaltHash
      })
    );
    yield put(
      encryptionKeyHashCreated({ encryptionKeyHash: newEncryptionKeyHash })
    );

    const vault = yield* sagaSelect(selectVault);

    // encrypt cipher with the new key
    const newVaultCipher = yield* sagaCall(() =>
      encryptVault(newEncryptionKeyHash, vault)
    );

    yield put(
      vaultCipherCreated({
        vaultCipher: newVaultCipher
      })
    );
  } catch (err) {
    console.error(err);
  }
}
