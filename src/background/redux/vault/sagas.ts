import { put, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { deriveKeyPair, validateSecretPhrase } from '@src/libs/crypto';
import {
  decryptSecretPhrase,
  encryptSecretPhrase
} from '@src/libs/crypto/secret-phrase';

import { selectSessionEncryptionKeyHash } from '../session/selectors';
import { sagaCall, sagaSelect } from '../utils';
import {
  accountAdded,
  vaultStateUpdated,
  createEmptyVault,
  initializeVault,
  createAccount,
  resetVault,
  vaultReseted,
  vaultLocked,
  lockVault,
  lastActivityTimeRefreshed,
  timeoutDurationChanged,
  startApp,
  unlockVault,
  vaultUnlocked
} from './actions';
import {
  selectKeyDerivationSaltHash,
  selectVaultDerivedAccounts,
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultLastActivityTime,
  selectVaultSecretPhraseCipher,
  selectVaultTimeoutDurationSetting
} from './selectors';
import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@src/libs/crypto/hashing';
import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { encryptionKeyHashCreated, sessionReseted } from '../session/actions';
import { convertBytesToHex } from '@src/libs/crypto/utils';
import { deploysReseted } from '../deploys/actions';
import { MapTimeoutDurationSettingToValue } from '@src/apps/popup/constants';

export function* vaultSagas() {
  yield takeLatest(getType(resetVault), resetVaultSaga);
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
  yield takeLatest(getType(createEmptyVault), createEmptyVaultSaga);
  yield takeLatest(getType(initializeVault), initializeVaultSaga);
  yield takeLatest(getType(createAccount), createAccountSaga);
}

/**
 *
 */
function* resetVaultSaga(action: ReturnType<typeof resetVault>) {
  try {
    yield put(vaultReseted());
    yield put(sessionReseted());
    yield put(deploysReseted());
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 */
function* lockVaultSaga(action: ReturnType<typeof lockVault>) {
  try {
    yield put(vaultLocked());
    yield put(sessionReseted());
    yield put(deploysReseted());
  } catch (err) {
    console.error(err);
  }
}

/**
 * generate new secret phrase cipher each login using a new key
 * do not reuse the same key all the time for encryption
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
    console.log(encryptionKeyHash);
    // decrypt secret phrase
    const secretPhraseCipher = yield* sagaSelect(selectVaultSecretPhraseCipher);
    const secretPhrase = yield* sagaCall(() =>
      decryptSecretPhrase(encryptionKeyHash, secretPhraseCipher)
    );
    console.log(secretPhrase);
    // derive a new random encryption key
    const newKeyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyBytes = yield* sagaCall(() =>
      deriveEncryptionKey(password, newKeyDerivationSaltHash)
    );
    const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);
    // encrypt secret phrase with new key
    const newSecretPhraseCipher = yield* sagaCall(() =>
      encryptSecretPhrase(newEncryptionKeyHash, secretPhrase)
    );
    console.log(newSecretPhraseCipher);

    yield put(
      vaultStateUpdated({
        keyDerivationSaltHash: newKeyDerivationSaltHash,
        secretPhraseCipher: newSecretPhraseCipher
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
 *
 */
function* createEmptyVaultSaga(action: ReturnType<typeof createEmptyVault>) {
  try {
    const { password } = action.payload;

    const passwordSaltHash = generateRandomSaltHex();
    const passwordHash = yield* sagaCall(() =>
      encodePassword(password, passwordSaltHash)
    );
    const keyDerivationSaltHash = generateRandomSaltHex();
    const encryptionKeyBytes = yield* sagaCall(() =>
      deriveEncryptionKey(password, keyDerivationSaltHash)
    );
    const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);

    yield put(
      vaultStateUpdated({
        passwordHash,
        passwordSaltHash,
        keyDerivationSaltHash
      })
    );
    yield put(
      encryptionKeyHashCreated({ encryptionKeyHash: encryptionKeyHash })
    );
  } catch (err) {
    console.error(err);
  }
}

/**
 *
 */
function* initializeVaultSaga(action: ReturnType<typeof initializeVault>) {
  try {
    const { secretPhrase } = action.payload;
    if (!validateSecretPhrase(secretPhrase)) {
      throw Error('Invalid secret phrase.');
    }

    const keyPair = deriveKeyPair(secretPhrase, 0);
    const account = {
      ...keyPair,
      name: 'Account 1'
    };

    const encryptionKeyHash = yield* sagaSelect(selectSessionEncryptionKeyHash);

    if (encryptionKeyHash == null) {
      throw Error("Encryption key doesn't exist");
    }

    const secretPhraseCipher = yield* sagaCall(() =>
      encryptSecretPhrase(encryptionKeyHash, secretPhrase)
    );

    yield put(
      vaultStateUpdated({
        secretPhraseCipher
      })
    );
    yield put(accountAdded(account));
    // cleanup and disabling action handler
    disableOnboardingFlow();
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

    const encryptionKeyHash = yield* sagaSelect(selectSessionEncryptionKeyHash);
    const secretPhraseCipher = yield* sagaSelect(selectVaultSecretPhraseCipher);
    const secretPhrase = yield* sagaCall(() =>
      decryptSecretPhrase(encryptionKeyHash, secretPhraseCipher)
    );

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
