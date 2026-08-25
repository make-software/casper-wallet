import { combineReducers } from '@reduxjs/toolkit';
import { Middleware, UnknownAction, applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { expectSaga } from 'redux-saga-test-plan';
import { storage, windows } from 'webextension-polyfill';

import { deliverCancelResponse } from '@background/handlers/cancel-requests';
import { vaultReseted } from '@background/redux/vault/actions';
import { windowManagementReseted } from '@background/redux/windowManagement/actions';
import { reducer as windowManagementReducer } from '@background/redux/windowManagement/reducer';
import { clearRequestSession } from '@background/redux/windowManagement/session-store';

import { reducer as keysReducer } from '../keys/reducer';
import { reducer as sessionReducer } from '../session/reducer';
import { initKeys, resetVault } from './actions';
import { onboardingSagas } from './onboarding-sagas';

jest.mock('webextension-polyfill', () => ({
  storage: { local: { clear: jest.fn() } },
  windows: { remove: jest.fn() }
}));
jest.mock('@background/open-onboarding-flow', () => ({
  disableOnboardingFlow: jest.fn()
}));
jest.mock('@libs/crypto/hashing', () => ({
  generateRandomSaltHex: jest.fn(() => 'salt')
}));
jest.mock('@background/workers/scrypt-off-thread', () => ({
  encodePasswordOffThread: jest.fn().mockResolvedValue('password-hash'),
  deriveScryptKey: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
}));
jest.mock('@background/handlers/cancel-requests', () => ({
  deliverCancelResponse: jest.fn()
}));
jest.mock('@background/redux/windowManagement/session-store', () => ({
  clearRequestSession: jest.fn()
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

/**
 * spec §8.3 — cancel-then-clear on wallet reset. The resets and
 * `storage.local.clear()` must complete synchronously inside the saga, before
 * anything the saga does not await (delivery, `windows.remove`, the session
 * mirror clear) has a chance to run — a slow or rejecting delivery must never
 * hold up the reset itself.
 */
describe('resetVaultSaga (spec §8.3 — cancel-then-clear on wallet reset)', () => {
  const openRequest = {
    status: 'open' as const,
    tabId: 3,
    origin: 'https://dapp',
    method: 'sign' as const,
    windowIds: [42],
    awaitingDeviceConfirmation: false,
    seq: 0
  };

  const stateWithOneOpenRequest = {
    windowManagement: {
      windowId: null,
      exportKeysWindowId: null,
      requests: { r1: openRequest }
    }
  };

  const countPutsOfType = (allEffects: unknown, type: string) =>
    (
      allEffects as Array<{
        type: string;
        payload?: { action?: { type?: string } };
      }>
    ).filter(
      effect => effect.type === 'PUT' && effect.payload?.action?.type === type
    ).length;

  beforeEach(() => {
    jest.clearAllMocks();
    (clearRequestSession as jest.Mock).mockResolvedValue(undefined);
    (windows.remove as jest.Mock).mockResolvedValue(undefined);
  });

  it('completes every reset and storage.local.clear() synchronously, even though delivery never resolves', async () => {
    (deliverCancelResponse as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { allEffects } = await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);

    expect(countPutsOfType(allEffects, vaultReseted.type)).toBe(1);
    expect(countPutsOfType(allEffects, windowManagementReseted.type)).toBe(1);
    expect(storage.local.clear).toHaveBeenCalled();
  });

  it('completes every reset and storage.local.clear() synchronously, even though delivery rejects', async () => {
    (deliverCancelResponse as jest.Mock).mockRejectedValue(
      new Error('delivery failed')
    );

    const { allEffects } = await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);

    expect(countPutsOfType(allEffects, vaultReseted.type)).toBe(1);
    expect(countPutsOfType(allEffects, windowManagementReseted.type)).toBe(1);
    expect(storage.local.clear).toHaveBeenCalled();
  });

  // `expectSaga(...).silentRun(50)` above only pins that the resets and
  // `storage.local.clear()` complete WITHIN 50ms of the dispatch — it would
  // stay green even if a `yield delay(0)` (or any other awaited effect) were
  // inserted ABOVE the first reset `put`, because 0ms/near-0ms async work
  // still resolves well inside a 50ms window. That is exactly the Firefox/
  // Safari regression spec §8.3 describes: on those targets the UI's
  // `.then(() => closeWindowByReloadExtension())` — `runtime.reload()` — races
  // the FIRST microtask/macrotask boundary after `store.dispatch(resetVault())`
  // returns, not a 50ms deadline. Only a real store + real saga middleware,
  // asserted on the very next synchronous line with no `await`, proves the
  // resets land inside the same synchronous flush as the dispatch call itself
  // (redux-saga drains `put`/`select` effects synchronously at semaphore 0,
  // before yielding back to the caller of `dispatch`).
  it('lands every reset and storage.local.clear() SYNCHRONOUSLY inside store.dispatch(resetVault()) — before delivery, which never resolves, could ever run', () => {
    (deliverCancelResponse as jest.Mock).mockReturnValue(new Promise(() => {}));
    (windows.remove as jest.Mock).mockReturnValue(new Promise(() => {}));
    (clearRequestSession as jest.Mock).mockReturnValue(new Promise(() => {}));

    const dispatchedTypes: string[] = [];
    const loggerMiddleware: Middleware = () => next => (action: unknown) => {
      dispatchedTypes.push((action as UnknownAction).type);
      return next(action);
    };

    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
      combineReducers({ windowManagement: windowManagementReducer }),
      { windowManagement: stateWithOneOpenRequest.windowManagement },
      applyMiddleware(loggerMiddleware, sagaMiddleware)
    );
    sagaMiddleware.run(onboardingSagas);

    store.dispatch(resetVault());

    // No `await`, no fake/real timers — this is the very next synchronous
    // statement after `dispatch` returned.
    expect(dispatchedTypes).toContain(vaultReseted.type);
    expect(dispatchedTypes).toContain(windowManagementReseted.type);
    expect(storage.local.clear).toHaveBeenCalled();
    expect(store.getState().windowManagement).toEqual({
      windowId: null,
      exportKeysWindowId: null,
      requests: {}
    });
  });

  it('delivers the cancel for an open request at reset time, from the pre-reset snapshot', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);

    expect(deliverCancelResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'r1',
        tabId: 3,
        origin: 'https://dapp',
        method: 'sign'
      }),
      'resetVaultSaga'
    );
  });

  it("removes the open request's window", async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);

    expect(windows.remove).toHaveBeenCalledWith(42);
  });

  it('clears the session mirror directly, joining the session-store write chain rather than relying on the subscriber guard', async () => {
    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: {}
        }
      })
      .dispatch(resetVault())
      .silentRun(50);

    expect(clearRequestSession).toHaveBeenCalled();
  });

  it('no open requests → no delivery, no window removal, mirror still cleared', async () => {
    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: {}
        }
      })
      .dispatch(resetVault())
      .silentRun(50);

    expect(deliverCancelResponse).not.toHaveBeenCalled();
    expect(windows.remove).not.toHaveBeenCalled();
    expect(clearRequestSession).toHaveBeenCalled();
  });

  it('logs, and does not throw, when a delivery rejects', async () => {
    (deliverCancelResponse as jest.Mock).mockRejectedValue(
      new Error('deliver failed: https://dapp/page?message=super-secret')
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      'resetVaultSaga: cancel delivery rejected',
      { requestId: 'r1' },
      expect.any(String)
    );
    const [, , loggedError] = consoleError.mock.calls.find(
      ([message]) => message === 'resetVaultSaga: cancel delivery rejected'
    )!;
    // Pins that the argument is `redactUrlQuery`'s output, not the raw
    // rejection: a raw `Error` would fail the type check, and an
    // un-redacted string would still carry the `?...=` query.
    expect(loggedError).not.toBeInstanceOf(Error);
    expect(loggedError).not.toMatch(/\?[^"]*=/);
    consoleError.mockRestore();
  });

  it('logs, and does not throw, when windows.remove rejects', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);
    (windows.remove as jest.Mock).mockRejectedValue(
      new Error('no such window: https://dapp/page?message=super-secret')
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      'resetVaultSaga: window removal failed',
      { windowId: 42 },
      expect.any(String)
    );
    const [, , loggedError] = consoleError.mock.calls.find(
      ([message]) => message === 'resetVaultSaga: window removal failed'
    )!;
    expect(loggedError).not.toBeInstanceOf(Error);
    expect(loggedError).not.toMatch(/\?[^"]*=/);
    consoleError.mockRestore();
  });

  it('logs, and does not throw, when clearing the session mirror rejects', async () => {
    (clearRequestSession as jest.Mock).mockRejectedValue(
      new Error('write failed: https://dapp/page?message=super-secret')
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: {}
        }
      })
      .dispatch(resetVault())
      .silentRun(50);
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      'resetVaultSaga: clear request mirror failed',
      expect.any(String)
    );
    const [, loggedError] = consoleError.mock.calls.find(
      ([message]) => message === 'resetVaultSaga: clear request mirror failed'
    )!;
    expect(loggedError).not.toBeInstanceOf(Error);
    expect(loggedError).not.toMatch(/\?[^"]*=/);
    consoleError.mockRestore();
  });
});
