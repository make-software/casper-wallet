import { all } from 'redux-saga/effects';
import { vaultSagas } from './vault/sagas';

export default function* rootSaga() {
  yield all([vaultSagas()]);
}
