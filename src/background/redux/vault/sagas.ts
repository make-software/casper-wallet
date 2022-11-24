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
  createAccount
} from './actions';
import {
  selectVaultDerivedAccounts,
  selectVaultSecretPhraseCipher
} from './selectors';
import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@src/libs/crypto/hashing';
import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';
import { encryptionKeyHashCreated } from '../session/actions';
import { convertBytesToHex } from '@src/libs/crypto/utils';

export function* vaultSagas() {
  yield takeLatest(getType(createEmptyVault), createEmptyVaultSaga);
  yield takeLatest(getType(initializeVault), initializeVaultSaga);
  yield takeLatest(getType(createAccount), createAccountSaga);
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
