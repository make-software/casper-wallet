import { all } from 'redux-saga/effects';

import { onboardingSagas } from './sagas/onboarding-sagas';
import { vaultSagas } from './sagas/vault-sagas';

export default function* rootSaga() {
  yield all([vaultSagas(), onboardingSagas()]);
}
