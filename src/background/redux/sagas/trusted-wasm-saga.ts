import { put, select, takeLatest } from 'redux-saga/effects';

import { removeAllWasmFromTrustedOrigin } from '../trusted-wasm/actions';
import { accountDisconnected, siteDisconnected } from '../vault/actions';
import { selectCountOfConnectedAccountsWithActiveOrigin } from '../vault/selectors';

export function* trustedWasmSaga() {
  yield takeLatest(accountDisconnected.type, accountDisconnectedSaga);
  yield takeLatest(siteDisconnected.type, siteDisconnectedSaga);
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
