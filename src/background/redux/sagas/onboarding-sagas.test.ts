import { combineReducers } from '@reduxjs/toolkit';
import { Middleware, UnknownAction, applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { expectSaga } from 'redux-saga-test-plan';
import { storage, windows } from 'webextension-polyfill';

import { deliverCancelResponse } from '@background/handlers/cancel-requests';
import { sagaError } from '@background/redux/app-events/actions';
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
 * The two puts are broadcast separately, so `keys && !session` between them is
 * indistinguishable from a locked vault and would flash the locked screen.
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
 * The resets and `storage.local.clear()` must complete synchronously, before
 * anything the saga does not await (delivery, `windows.remove`, mirror clear)
 * has a chance to run.
 */
describe('resetVaultSaga (cancel-then-clear on wallet reset)', () => {
  const openRequest = {
    status: 'open' as const,
    tabId: 3,
    // Present in the fixture so a dropped-frameId pass-through fails a test: an
    // omitted `frameId` resumes the unscoped broadcast.
    frameId: 5,
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

  // `silentRun(50)` above would stay green with a `yield delay(0)` inserted; only
  // a real store asserted on the next synchronous line pins the flush ordering.
  it('lands every reset and storage.local.clear() SYNCHRONOUSLY inside store.dispatch(resetVault()) — before window removal or the mirror clear, which never resolve, could ever run', () => {
    // Resolved, not never-resolving: the CALL is what pins the snapshot ordering.
    // `windows.remove` / `clearRequestSession` prove the saga does not wait on them.
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);
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
    // Pins that `select(selectOpenRequests)` ran BEFORE the resets: after them
    // `openRequests` would be empty and this would never be called at all.
    expect(deliverCancelResponse).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'r1' }),
      'resetVaultSaga'
    );
  });

  it('delivers the cancel for an open request at reset time, from the pre-reset snapshot', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);

    // Not a partial `objectContaining` that omits `frameId`: a row that silently
    // lost its frame scoping would still pass a check that doesn't name it.
    expect(deliverCancelResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'r1',
        tabId: 3,
        frameId: 5,
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
    // Pins that the argument is `redactUrlQuery`'s output: a raw `Error` fails the
    // first check, an un-redacted string still carries the `?...=` query.
    expect(loggedError).not.toBeInstanceOf(Error);
    expect(loggedError).not.toMatch(/\?[^"]*=/);
    consoleError.mockRestore();
  });

  it('logs, dispatches sagaError, and does not throw, when windows.remove rejects — while the resets still complete synchronously', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);
    (windows.remove as jest.Mock).mockRejectedValue(
      new Error('no such window: https://dapp/page?message=super-secret')
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { allEffects } = await expectSaga(onboardingSagas)
      .withState(stateWithOneOpenRequest)
      .dispatch(resetVault())
      .silentRun(50);
    await Promise.resolve();
    await Promise.resolve();

    // The descriptors and the mirror are already gone by the time this fires, so
    // nothing else will ever find this window again: it must not stay console-only.
    expect(countPutsOfType(allEffects, windowManagementReseted.type)).toBe(1);
    expect(countPutsOfType(allEffects, sagaError.type)).toBe(1);
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

  it("excludes the originating window from removal, even when it also appears in a request's windowIds", async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: { r1: { ...openRequest, windowIds: [42, 43] } }
        }
      })
      // 43 is the window `resetVault` was dispatched FROM — closing it would
      // kill the page's own continuation.
      .dispatch(resetVault(43))
      .silentRun(50);

    expect(windows.remove).toHaveBeenCalledTimes(1);
    expect(windows.remove).toHaveBeenCalledWith(42);
    expect(windows.remove).not.toHaveBeenCalledWith(43);
  });

  it('also removes the shared approval window and the export-keys window', async () => {
    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: 7,
          exportKeysWindowId: 8,
          requests: {}
        }
      })
      .dispatch(resetVault())
      .silentRun(50);

    // Neither is a request, so `selectOpenRequests` alone would miss both — the
    // approval window would never close and the export-keys guard would stay off.
    expect(windows.remove).toHaveBeenCalledTimes(2);
    expect(windows.remove).toHaveBeenCalledWith(7);
    expect(windows.remove).toHaveBeenCalledWith(8);
  });

  it('delivers to and removes windows for two open requests, deduping the window they share', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    const r1 = { ...openRequest, windowIds: [42, 43] };
    const r2 = { ...openRequest, tabId: 9, windowIds: [42] };

    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: { r1, r2 }
        }
      })
      .dispatch(resetVault())
      .silentRun(50);

    expect(deliverCancelResponse).toHaveBeenCalledTimes(2);
    expect(windows.remove).toHaveBeenCalledTimes(2);
    expect(windows.remove).toHaveBeenCalledWith(42);
    expect(windows.remove).toHaveBeenCalledWith(43);
  });

  it('dedupes window removal across multiple open requests sharing a window, and covers the whole widened set at once', async () => {
    (deliverCancelResponse as jest.Mock).mockResolvedValue(1);

    const r1 = { ...openRequest, windowIds: [42, 43] };
    const r2 = { ...openRequest, tabId: 9, windowIds: [42] };

    await expectSaga(onboardingSagas)
      .withState({
        windowManagement: {
          windowId: 44,
          exportKeysWindowId: 45,
          requests: { r1, r2 }
        }
      })
      // 43 also names a request window (r1's) — must still be excluded.
      .dispatch(resetVault(43))
      .silentRun(50);

    expect(deliverCancelResponse).toHaveBeenCalledTimes(2);
    // 42 is shared by r1 and r2, 43 is the excluded origin, 44 and 45 come from
    // the widened snapshot: {42, 44, 45}, not four and not five.
    expect(windows.remove).toHaveBeenCalledTimes(3);
    expect(windows.remove).toHaveBeenCalledWith(42);
    expect(windows.remove).toHaveBeenCalledWith(44);
    expect(windows.remove).toHaveBeenCalledWith(45);
    expect(windows.remove).not.toHaveBeenCalledWith(43);
  });
});
