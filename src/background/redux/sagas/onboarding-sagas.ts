import { put, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';
import { storage } from 'webextension-polyfill';

import { disableOnboardingFlow } from '@background/open-onboarding-flow';
import { contactsReseted } from '@background/redux/contacts/actions';
import { recipientPublicKeyReseted } from '@background/redux/recent-recipient-public-keys/actions';
import { vaultSettingsReseted } from '@background/redux/settings/actions';

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
  deploysReseted,
  secretPhraseCreated,
  vaultReseted
} from '../vault/actions';
import { initKeys, initVault, resetVault } from './actions';

export function* onboardingSagas() {
  yield takeLatest(getType(resetVault), resetVaultSaga);
  yield takeLatest(getType(initKeys), initKeysSage);
  yield takeLatest(getType(initVault), initVaultSaga);
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
    yield put(vaultSettingsReseted());

    storage.local.clear();
  } catch (err) {
    console.error(err);
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
  }
}

/**
 *
 */
function* initVaultSaga(action: ReturnType<typeof initVault>) {
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

    yield put(secretPhraseCreated(secretPhrase));
    yield put(accountAdded(account));
    yield put(vaultUnlocked());
    // cleanup and disabling action handler
    disableOnboardingFlow();
  } catch (err) {
    console.error(err);
  }
}
