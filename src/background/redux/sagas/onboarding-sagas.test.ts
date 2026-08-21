import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';

import { reducer as keysReducer } from '../keys/reducer';
import { reducer as sessionReducer } from '../session/reducer';
import { initKeys } from './actions';
import { onboardingSagas } from './onboarding-sagas';

jest.mock('webextension-polyfill', () => ({
  storage: { local: { clear: jest.fn() } }
}));
jest.mock('@background/open-onboarding-flow', () => ({
  disableOnboardingFlow: jest.fn()
}));
jest.mock('@libs/crypto/hashing', () => ({
  encodePassword: jest.fn().mockResolvedValue('password-hash'),
  deriveEncryptionKey: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  generateRandomSaltHex: jest.fn(() => 'salt')
}));

const rootReducer = combineReducers({
  keys: keysReducer,
  session: sessionReducer
});

/**
 * The two puts are broadcast separately, so the state between them is a state
 * the onboarding tab renders. `keys && !session` is indistinguishable from a
 * locked vault and would flash the locked screen over the create-password page.
 */
it('never leaves keys visible without a session while creating them', async () => {
  const seenRoutingStates: Array<{
    keysDoesExist: boolean;
    encryptionKeyDoesExist: boolean;
  }> = [];

  const recordingReducer: typeof rootReducer = (state, action) => {
    const next = rootReducer(state, action);
    seenRoutingStates.push({
      keysDoesExist: next.keys.keysDoesExist,
      encryptionKeyDoesExist: next.session.encryptionKeyDoesExist
    });
    return next;
  };

  const { storeState } = await expectSaga(onboardingSagas)
    .withReducer(recordingReducer)
    .dispatch(initKeys({ password: 'password' }))
    .silentRun();

  expect(
    seenRoutingStates.filter(
      ({ keysDoesExist, encryptionKeyDoesExist }) =>
        keysDoesExist && !encryptionKeyDoesExist
    )
  ).toHaveLength(0);

  expect(storeState.keys.keysDoesExist).toBe(true);
  expect(storeState.session.encryptionKeyDoesExist).toBe(true);
});
