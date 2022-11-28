import { all } from 'redux-saga/effects';
import { vaultSagas } from './sagas/vault-sagas';
import { onboardingSagas } from './sagas/onboarding-sagas';

export default function* rootSaga() {
  yield all([vaultSagas(), onboardingSagas()]);
}
