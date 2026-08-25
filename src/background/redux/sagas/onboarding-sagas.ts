import { put, select, takeLatest } from 'redux-saga/effects';
import { storage, windows } from 'webextension-polyfill';

import { ErrorMessages } from '@src/constants';

import { deliverCancelResponse } from '@background/handlers/cancel-requests';
import { disableOnboardingFlow } from '@background/open-onboarding-flow';
import { redactUrlQuery } from '@background/redact-url-query';
import {
  resetAppEventsDismission,
  sagaError
} from '@background/redux/app-events/actions';
import { contactsReseted } from '@background/redux/contacts/actions';
import { resetRateApp } from '@background/redux/rate-app/actions';
import { recipientPublicKeyReseted } from '@background/redux/recent-recipient-public-keys/actions';
import { vaultSettingsReseted } from '@background/redux/settings/actions';
import { resetTrustedWasmState } from '@background/redux/trusted-wasm/actions';
import { windowManagementReseted } from '@background/redux/windowManagement/actions';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';
import { clearRequestSession } from '@background/redux/windowManagement/session-store';
import { OpenRequest } from '@background/redux/windowManagement/types';
import {
  deriveScryptKey,
  encodePasswordOffThread
} from '@background/workers/scrypt-off-thread';

import { deriveKeyPair, validateSecretPhrase } from '@libs/crypto';
import { generateRandomSaltHex } from '@libs/crypto/hashing';
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
import { errorToMessage } from './utils';

export function* onboardingSagas() {
  yield takeLatest(resetVault.type, resetVaultSaga);
  yield takeLatest(initKeys.type, initKeysSage);
  yield takeLatest(initVault.type, initVaultSaga);
  yield takeLatest(recoverVault.type, recoverVaultSaga);
}

// Fire-and-forget: delivery and window cleanup run AFTER the resets below
// have already completed, from a snapshot taken before any of them. Never
// awaited by the saga — see the ordering note there. `failRequestOnWindowError`
// cannot be reused directly here: it needs the store (to dispatch the
// tombstone), which the wallet no longer has any use for once every slice is
// already wiped, so this only needs `deliverCancelResponse`, the store-free
// half it shares.
function deliverResetCancels(openRequests: readonly OpenRequest[]): void {
  for (const request of openRequests) {
    deliverCancelResponse(request, 'resetVaultSaga').catch(error => {
      console.error(
        'resetVaultSaga: cancel delivery failed',
        { requestId: request.requestId },
        redactUrlQuery(error)
      );
    });
  }

  const windowIds = [...new Set(openRequests.flatMap(r => r.windowIds))];

  for (const windowId of windowIds) {
    windows.remove(windowId).catch(error => {
      console.error(
        'resetVaultSaga: window removal failed',
        { windowId },
        redactUrlQuery(error)
      );
    });
  }
}

/**
 *
 */
function* resetVaultSaga() {
  try {
    // Snapshotted BEFORE any reset: the reducer that clears `windowManagement`
    // below throws away the descriptors this needs to cancel and to find the
    // approval windows to close.
    const openRequests: OpenRequest[] = yield select(selectOpenRequests);

    // Order matters and is the whole point (spec §8.3). Today the twelve
    // `put`s below complete synchronously inside `store.dispatch(resetVault())`
    // — before `handleReduxAction` responds and before the UI's
    // `.then(() => closeWindowByReloadExtension())` runs, which on Firefox and
    // Safari is `runtime.reload()`. Any awaited I/O ahead of them would let
    // that reload kill the saga first, so the resets and `storage.local.clear()`
    // would never run. Everything below this comment through `storage.local
    // .clear()` MUST stay synchronous — no `yield call`/`yield` on a Promise.
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
    yield put(windowManagementReseted());

    storage.local.clear();

    // The reducer above returns the shared `initialState` reference, so when
    // `windowManagement` was already at rest the subscriber's identity guard
    // (get-main-store.ts) sees no change and never persists the clear. Join
    // the write chain directly instead of relying on it.
    clearRequestSession().catch(error => {
      console.error(
        'resetVaultSaga: clear request mirror failed',
        redactUrlQuery(error)
      );
    });

    // Deliveries and window removal happen strictly AFTER the synchronous
    // block above, from the snapshot. A slow or rejecting delivery must not
    // delay or break the resets or `storage.local.clear()` — it can't, since
    // this call is not awaited.
    deliverResetCancels(openRequests);
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'resetVaultSaga', message: errorToMessage(err) })
    );
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
      encodePasswordOffThread(password, passwordSaltHash)
    );
    const keyDerivationSaltHash = generateRandomSaltHex();
    const encryptionKeyBytes = yield* sagaCall(() =>
      deriveScryptKey(password, keyDerivationSaltHash)
    );
    const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);

    // Session first, keys second, and the order is load-bearing: the store
    // subscriber broadcasts after every dispatch, so the state between these two
    // puts really does reach the onboarding tab. `keys && !session` is what a
    // locked vault looks like, which would flash the locked screen mid-signup;
    // `session && !keys` reads as a fresh install, whose routes still include
    // the create-password page this runs from.
    yield put(
      encryptionKeyHashCreated({ encryptionKeyHash: encryptionKeyHash })
    );
    yield put(
      keysUpdated({
        passwordHash,
        passwordSaltHash,
        keyDerivationSaltHash
      })
    );
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'initKeysSage', message: errorToMessage(err) })
    );
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
    yield put(
      sagaError({ source: 'initVaultSaga', message: errorToMessage(err) })
    );
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
    yield put(
      sagaError({ source: 'recoverVaultSaga', message: errorToMessage(err) })
    );
  }
}
