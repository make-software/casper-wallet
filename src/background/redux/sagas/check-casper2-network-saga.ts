import { HttpHandler, RpcClient } from 'casper-js-sdk';
import { InfoGetStatusResult } from 'casper-js-sdk/dist/rpc/response';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { getType } from 'typesafe-actions';

import { REFERRER_URL } from '@src/constants';

import {
  activeNetworkSettingChanged,
  casperNetworkApiVersionChanged
} from '@background/redux/settings/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

import { unlockVault } from './actions';

export function* watchCasper2NetworkSaga() {
  yield takeLatest(
    [getType(unlockVault), getType(activeNetworkSettingChanged)],
    checkCasper2NetworkSaga
  );
}

function* checkCasper2NetworkSaga() {
  try {
    const { nodeUrl }: { nodeUrl: string } = yield select(
      selectApiConfigBasedOnActiveNetwork
    );

    const handler = new HttpHandler(nodeUrl, 'fetch');
    handler.setReferrer(REFERRER_URL);
    const rpcClient = new RpcClient(handler);

    const status: InfoGetStatusResult = yield call([
      rpcClient,
      rpcClient.getStatus
    ]);

    yield put(casperNetworkApiVersionChanged(status.apiVersion));
  } catch (err) {
    console.error(err);
  }
}
