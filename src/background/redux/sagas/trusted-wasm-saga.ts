import { put, select, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import {
  removeAllWasmFromTrustedOrigin,
  resetTrustedWasmState
} from '../trusted-wasm/actions';
import {
  accountDisconnected,
  siteDisconnected,
  vaultReseted
} from '../vault/actions';
import { selectCountOfConnectedAccountsWithActiveOrigin } from '../vault/selectors';

export function* trustedWasmSaga() {
  yield takeLatest(getType(vaultReseted), vaultResetedSaga);
  yield takeLatest(getType(accountDisconnected), accountDisconnectedSaga);
  yield takeLatest(getType(siteDisconnected), siteDisconnectedSaga);
}

function* vaultResetedSaga() {
  yield put(resetTrustedWasmState());
}

function* accountDisconnectedSaga({
  payload: { siteOrigin }
}: ReturnType<typeof accountDisconnected>) {
  const count: number = yield select(
    selectCountOfConnectedAccountsWithActiveOrigin
  );

  if (Number(count) < 1) {
    yield put(removeAllWasmFromTrustedOrigin({ origin: siteOrigin }));
  }
}

function* siteDisconnectedSaga({
  payload: { siteOrigin }
}: ReturnType<typeof siteDisconnected>) {
  yield put(removeAllWasmFromTrustedOrigin({ origin: siteOrigin }));
}
