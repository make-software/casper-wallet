import { call, put, select, takeLatest } from 'redux-saga/effects';

import { NetworkSetting, getCasperNetwork } from '@src/constants';

import { sagaError } from '@background/redux/app-events/actions';
import {
  activeNetworkSettingChanged,
  casperNetworkApiVersionChanged
} from '@background/redux/settings/actions';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { casperTransactionsRepository } from '@background/signing-repositories';

import { unlockVault } from './actions';
import { errorToMessage } from './utils';

export function* watchCasper2NetworkSaga() {
  yield takeLatest(
    [unlockVault.type, activeNetworkSettingChanged.type],
    checkCasper2NetworkSaga
  );
}

function* checkCasper2NetworkSaga() {
  try {
    const activeNetworkSetting: NetworkSetting = yield select(
      selectActiveNetworkSetting
    );

    const apiVersion: string = yield call(
      [casperTransactionsRepository, 'getNetworkApiVersion'],
      getCasperNetwork(activeNetworkSetting)
    );

    yield put(casperNetworkApiVersionChanged(apiVersion));
  } catch (err) {
    console.error(err);
    yield put(
      sagaError({
        source: 'checkCasper2NetworkSaga',
        message: errorToMessage(err)
      })
    );
  }
}
