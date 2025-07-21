import { all } from 'redux-saga/effects';

import { watchCasper2NetworkSaga } from './sagas/check-casper2-network-saga';
import { onboardingSagas } from './sagas/onboarding-sagas';
import { trustedWasmSaga } from './sagas/trusted-wasm-saga';
import { vaultSagas } from './sagas/vault-sagas';

export default function* rootSaga() {
  yield all([
    vaultSagas(),
    onboardingSagas(),
    watchCasper2NetworkSaga(),
    trustedWasmSaga()
  ]);
}
