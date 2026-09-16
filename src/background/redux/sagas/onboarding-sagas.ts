import { call, fork, put, select, takeLatest } from 'redux-saga/effects';
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
import {
  selectExportKeysWindowId,
  selectOpenRequests,
  selectWindowId
} from '@background/redux/windowManagement/selectors';
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

function deliverResetCancels(openRequests: readonly OpenRequest[]): void {
  for (const request of openRequests) {
    deliverCancelResponse(request, 'resetVaultSaga').catch(error => {
      console.error(
        'resetVaultSaga: cancel delivery rejected',
        { requestId: request.requestId },
        redactUrlQuery(error)
      );
    });
  }
}

// Forked, not a bare `.catch`: a rejection must reach the store via `put`, which
// only a saga effect can do. Window id only; no origins/URLs.
function* removeResetWindow(windowId: number) {
  try {
    yield call([windows, windows.remove], windowId);
  } catch (error) {
    console.error(
      'resetVaultSaga: window removal failed',
      { windowId },
      redactUrlQuery(error)
    );
    yield put(
      sagaError({
        source: 'resetVaultSaga',
        message: `Could not close window ${windowId} after reset`
      })
    );
  }
}

function* resetVaultSaga(action: ReturnType<typeof resetVault>) {
  try {
    // Snapshotted before any reset: the reducers below throw away the descriptors
    // to cancel and the window ids to close, two of which are not requests.
    const openRequests: OpenRequest[] = yield select(selectOpenRequests);
    const windowId: number | null = yield select(selectWindowId);
    const exportKeysWindowId: number | null = yield select(
      selectExportKeysWindowId
    );

    // Everything through `storage.local.clear()` MUST stay synchronous: on Firefox
    // and Safari the UI's `runtime.reload()` would kill the saga at any awaited I/O.
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

    // The reducer returns the shared `initialState` reference, so a slice already
    // at rest fails the subscriber's identity guard and never persists the clear.
    clearRequestSession().catch(error => {
      console.error(
        'resetVaultSaga: clear request mirror failed',
        redactUrlQuery(error)
      );
    });

    // Not awaited: a slow or rejecting delivery must not delay the resets above.
    deliverResetCancels(openRequests);

    // The originating window is excluded: `ResetVaultPage` can render inside an
    // approval window, and removing it kills the page's own continuation.
    const senderWindowId = action.payload.senderWindowId;
    const windowIdsToRemove = new Set(
      [
        ...openRequests.flatMap(r => r.windowIds),
        windowId,
        exportKeysWindowId
      ].filter((id): id is number => id != null && id !== senderWindowId)
    );

    for (const id of windowIdsToRemove) {
      yield fork(removeResetWindow, id);
    }
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'resetVaultSaga', message: errorToMessage(err) })
    );
  }
}

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

    // Session first, keys second: the store broadcasts between the two puts, and
    // `keys && !session` looks like a locked vault and flashes that screen.
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
    disableOnboardingFlow();
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({ source: 'recoverVaultSaga', message: errorToMessage(err) })
    );
  }
}
