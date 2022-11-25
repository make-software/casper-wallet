import { put, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { deriveKeyPair } from '@src/libs/crypto';
import { decryptVault, encryptVault } from '@src/libs/crypto/vault';

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
  selectSecretPhrase,
  selectVault,
  selectVaultDerivedAccounts,
  selectVaultDoesExist,
  selectVaultTimeoutDurationSetting
} from '../vault/selectors';
import {
  deriveEncryptionKey,
  generateRandomSaltHex
} from '@src/libs/crypto/hashing';
import {
  encryptionKeyHashCreated,
  lastActivityTimeRefreshed,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';
import { convertBytesToHex } from '@src/libs/crypto/utils';
import { MapTimeoutDurationSettingToValue } from '@src/apps/popup/constants';
import { selectKeyDerivationSaltHash } from '../keys/selectors';
import { createAccount, lockVault, startApp, unlockVault } from './actions';
import { selectVaultCipher } from '../vault-cipher/selectors';
import { keysUpdated } from '../keys/actions';
import { vaultCipherCreated } from '../vault-cipher/actions';
import { deploysReseted } from '../deploys/actions';

export function* vaultSagas() {
  yield takeLatest(getType(lockVault), lockVaultSaga);
  yield takeLatest(getType(unlockVault), unlockVaultSaga);
  yield takeLatest(
    [
      getType(startApp),
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
 *
 */
function* lockVaultSaga(action: ReturnType<typeof lockVault>) {
  try {
    yield put(sessionReseted());
    yield put(vaultReseted());
    yield put(deploysReseted());
  } catch (err) {
    console.error(err);
  }
}

/**
 * generate a new encryption key each login and update stored cipher
 * do not reuse the same key all the time for encryption - collisions
 */
function* unlockVaultSaga(action: ReturnType<typeof unlockVault>) {
  try {
    const { password } = action.payload;

    // get current encryption key
    const keyDerivationSaltHash = yield* sagaSelect(
      selectKeyDerivationSaltHash
    );
    const encryptionKeyBytes = yield* sagaCall(() =>
      deriveEncryptionKey(password, keyDerivationSaltHash)
    );
    const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);
    // decrypt cipher
    const vaultCipher = yield* sagaSelect(selectVaultCipher);
    const vault = yield* sagaCall(() =>
      decryptVault(encryptionKeyHash, vaultCipher)
    );
    // derive a new random encryption key
    const newKeyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyBytes = yield* sagaCall(() =>
      deriveEncryptionKey(password, newKeyDerivationSaltHash)
    );
    const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);
    // encrypt cipher with the new key
    const newVaultCipher = yield* sagaCall(() =>
      encryptVault(newEncryptionKeyHash, vault)
    );

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
    const vaultDoesExists = yield* sagaSelect(selectVaultDoesExist);
    const vaultIsLocked = yield* sagaSelect(selectVaultIsLocked);
    const vaultLastActivityTime = yield* sagaSelect(
      selectVaultLastActivityTime
    );
    const vaultTimeoutDurationSetting = yield* sagaSelect(
      selectVaultTimeoutDurationSetting
    );
    const timeoutDurationValue =
      MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

    if (vaultDoesExists && !vaultIsLocked && vaultLastActivityTime) {
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

    const derivedAccounts = yield* sagaSelect(selectVaultDerivedAccounts);
    const accountCount = derivedAccounts.length;
    const secretPhrase = yield* sagaSelect(selectSecretPhrase);

    const keyPair = deriveKeyPair(secretPhrase, accountCount);
    const account = {
      ...keyPair,
      name: name ?? `Account ${accountCount + 1}`
    };

    yield put(accountAdded(account));
  } catch (err) {
    console.error(err);
  }
}
