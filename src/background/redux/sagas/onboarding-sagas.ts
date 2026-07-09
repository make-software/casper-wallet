import { put, takeLatest } from 'redux-saga/effects';
import { storage } from 'webextension-polyfill';

import { ErrorMessages } from '@src/constants';

import { disableOnboardingFlow } from '@background/open-onboarding-flow';
import {
  resetAppEventsDismission,
  sagaError
} from '@background/redux/app-events/actions';
import { contactsReseted } from '@background/redux/contacts/actions';
import { resetRateApp } from '@background/redux/rate-app/actions';
import { recipientPublicKeyReseted } from '@background/redux/recent-recipient-public-keys/actions';
import { vaultSettingsReseted } from '@background/redux/settings/actions';
import { resetTrustedWasmState } from '@background/redux/trusted-wasm/actions';

import { deriveKeyPair, validateSecretPhrase } from '@libs/crypto';
import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';

import { keysReseted, keysUpdated } from '../keys/actions';
import { loginRetryCountReseted } from '../login-retry-count/actions';
import {
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} from '../session/actions';
import { sagaCall } from '../utils';
import { vaultCipherReseted } from '../vault-cipher/actions';
import {
  accountAdded,
  accountsAdded,
  deploysReseted,
  secretPhraseCreated,
  vaultReseted
} from '../vault/actions';
import { initKeys, initVault, recoverVault, resetVault } from './actions';

export function* onboardingSagas() {
  yield takeLatest(resetVault.type, resetVaultSaga);
  yield takeLatest(initKeys.type, initKeysSage);
  yield takeLatest(initVault.type, initVaultSaga);
  yield takeLatest(recoverVault.type, recoverVaultSaga);
}

/**
 *
 */
function* resetVaultSaga() {
  try {
    yield put(vaultReseted());
    yield put(vaultCipherReseted());
    yield put(keysReseted());
    yield put(sessionReseted());
    yield put(deploysReseted());
    yield put(loginRetryCountReseted());
    yield put(recipientPublicKeyReseted());
    yield put(contactsReseted());
    yield put(resetTrustedWasmState());
    yield put(vaultSettingsReseted());
    yield put(resetRateApp());
    yield put(resetAppEventsDismission());

    storage.local.clear();
  } catch (err) {
    console.error(err);
    yield put(sagaError({ source: 'resetVaultSaga', message: String(err) }));
  }
}

/**
 *
 */
function* initKeysSage(action: ReturnType<typeof initKeys>) {
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
      keysUpdated({
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
    yield put(sagaError({ source: 'initKeysSage', message: String(err) }));
  }
}

/**
 *
 */
function* initVaultSaga(action: ReturnType<typeof initVault>) {
  try {
    const { secretPhrase } = action.payload;
    if (!validateSecretPhrase(secretPhrase)) {
      throw Error(ErrorMessages.secretPhrase.INVALID_SECRET_PHRASE.message);
    }

    const keyPair = deriveKeyPair(secretPhrase, 0);
    const account = {
      ...keyPair,
      name: 'Account 1',
      hidden: false
    };

    yield put(secretPhraseCreated(secretPhrase));
    yield put(accountAdded(account));
    yield put(vaultUnlocked());
    // cleanup and disabling action handler
    disableOnboardingFlow();
  } catch (err) {
    console.error(err);
    yield put(sagaError({ source: 'initVaultSaga', message: String(err) }));
  }
}

function* recoverVaultSaga(action: ReturnType<typeof recoverVault>) {
  try {
    const { secretPhrase, accounts } = action.payload;
    if (!validateSecretPhrase(secretPhrase)) {
      throw Error(ErrorMessages.secretPhrase.INVALID_SECRET_PHRASE.message);
    }

    yield put(secretPhraseCreated(secretPhrase));
    yield put(accountsAdded(accounts));
    yield put(vaultUnlocked());
    // cleanup and disabling action handler
    disableOnboardingFlow();
  } catch (err) {
    console.error(err);
    yield put(sagaError({ source: 'recoverVaultSaga', message: String(err) }));
  }
}
