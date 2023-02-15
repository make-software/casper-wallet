import { put, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { deriveKeyPair } from '@src/libs/crypto';
import { encryptVault } from '@src/libs/crypto/vault';

import { MapTimeoutDurationSettingToValue } from '@src/apps/popup/constants';

import {
  selectEncryptionKeyHash,
  selectVaultIsLocked,
  selectVaultLastActivityTime
} from '../session/selectors';
import { sagaCall, sagaSelect } from '../utils';
import {
  accountAdded,
  timeoutDurationChanged,
  accountImported,
  accountRenamed,
  accountRemoved,
  accountsConnected,
  accountDisconnected,
  allAccountsDisconnected,
  activeAccountChanged,
  vaultLoaded,
  vaultReseted
} from '../vault/actions';
import {
  selectIsActiveAccountConnectedWithOrigin,
  selectSecretPhrase,
  selectVault,
  selectVaultActiveAccount,
  selectVaultDerivedAccounts,
  selectVaultTimeoutDurationSetting
} from '../vault/selectors';
import {
  encryptionKeyHashCreated,
  lastActivityTimeRefreshed,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';

import {
  createAccount,
  lockVaultForFiveMinutes,
  lockVault,
  startBackground,
  unlockVault
} from './actions';
import { selectVaultCipherDoesExist } from '../vault-cipher/selectors';
import { keysUpdated } from '../keys/actions';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { deploysReseted } from '../deploys/actions';
import { loginRetryCountReseted } from '../login-retry-count/actions';
import { sdkEvent } from '@src/content/sdk-event';
import { emitSdkEventToAllActiveTabs } from '@src/background/emit-sdk-event-to-all-active-tabs';

export function* vaultSagas() {
  yield takeLatest(getType(lockVault), lockVaultSaga);
  yield takeLatest(
    getType(lockVaultForFiveMinutes),
    lockVaultForFiveMinutesSaga
  );
  yield takeLatest(getType(unlockVault), unlockVaultSaga);
  yield takeLatest(
    [
      getType(startBackground),
      getType(lastActivityTimeRefreshed),
      getType(timeoutDurationChanged)
    ],
    timeoutCounterSaga
  );
  yield takeLatest(
    [
      getType(accountAdded),
      getType(accountImported),
      getType(accountRemoved),
      getType(accountRenamed),
      getType(accountsConnected),
      getType(accountDisconnected),
      getType(allAccountsDisconnected),
      getType(activeAccountChanged),
      getType(timeoutDurationChanged)
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

    emitSdkEventToAllActiveTabs(
      sdkEvent.lockedEvent({
        isLocked: true,
        isConnected: false,
        activeKey: null
      })
    );
  } catch (err) {
    console.error(err);
  }
}

function* lockVaultForFiveMinutesSaga() {
  yield put(lockVault());

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const timeoutDurationValue = MapTimeoutDurationSettingToValue['5 min'];

  yield* sagaCall(delay, timeoutDurationValue);

  yield put(loginRetryCountReseted());
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

    const isActiveAccountConnected = yield* sagaSelect(
      selectIsActiveAccountConnectedWithOrigin
    );
    const activeAccount = yield* sagaSelect(selectVaultActiveAccount);

    if (activeAccount) {
      emitSdkEventToAllActiveTabs(
        sdkEvent.unlockedEvent({
          isLocked: false,
          isConnected: isActiveAccountConnected,
          activeKey: isActiveAccountConnected ? activeAccount.publicKey : null
        })
      );
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
      selectVaultTimeoutDurationSetting
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
