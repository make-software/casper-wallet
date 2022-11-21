import { put, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { deriveKeyPair, validateSecretPhrase } from '@src/libs/crypto';
import { encryptSecretPhrase } from '@src/libs/crypto/storage-encryption';

import { selectSessionSecretPhrase } from '../session/selectors';
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
  selectKeyDerivationSaltHash
} from './selectors';
import {
  encodePassword,
  generateRandomSaltHex
} from '@src/libs/crypto/hashing';
import { disableOnboardingFlow } from '@src/background/open-onboarding-flow';

export function* vaultSagas() {
  yield takeLatest(getType(createEmptyVault), createEmptyVaultSaga);
  yield takeLatest(getType(initializeVault), initializeVaultSaga);
  yield takeLatest(getType(createAccount), createAccountSaga);
}

/**
 *
 */
function* createEmptyVaultSaga(action: ReturnType<typeof createEmptyVault>) {
  const { password } = action.payload;

  const passwordSaltHash = generateRandomSaltHex();
  const passwordHash = yield* sagaCall(() =>
    encodePassword(password, passwordSaltHash)
  );
  const keyDerivationSaltHash = generateRandomSaltHex();

  yield put(
    vaultStateUpdated({
      passwordHash,
      passwordSaltHash,
      keyDerivationSaltHash
    })
  );
}

/**
 *
 */
function* initializeVaultSaga(action: ReturnType<typeof initializeVault>) {
  const { secretPhrase } = action.payload;
  if (!validateSecretPhrase(secretPhrase)) {
    throw Error('Invalid secret phrase.');
  }

  const keyPair = deriveKeyPair(secretPhrase, 0);
  const account = {
    ...keyPair,
    name: 'Account 1'
  };

  const password = 'dasdasdsa';
  const keyDerivationSaltHash = yield* sagaSelect(selectKeyDerivationSaltHash);
  const secretPhraseCipher = yield* sagaCall(() =>
    encryptSecretPhrase(secretPhrase, password, keyDerivationSaltHash)
  );

  yield put(
    vaultStateUpdated({
      secretPhraseCipher
    })
  );
  yield put(accountAdded(account));
  // cleanup and disabling action handler
  disableOnboardingFlow();
}

/**
 *
 */
function* createAccountSaga(action: ReturnType<typeof createAccount>) {
  const { name } = action.payload;

  const secretPhrase = yield* sagaSelect(selectSessionSecretPhrase);
  const derivedAccounts = yield* sagaSelect(selectVaultDerivedAccounts);

  const accountCount = derivedAccounts.length;

  const keyPair = deriveKeyPair(secretPhrase, accountCount);
  const account = {
    ...keyPair,
    name: name ?? `Account ${accountCount + 1}`
  };

  yield put(accountAdded(account));
}
