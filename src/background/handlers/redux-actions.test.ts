import { Runtime, windows } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import { enableOnboardingFlow } from '@background/open-onboarding-flow';
import { dismissSagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import { lockVault, resetVault } from '@background/redux/sagas/actions';
import { accountRenamed } from '@background/redux/vault/actions';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { handleReduxAction } from './redux-actions';

// enableOnboardingFlow touches webextension-polyfill; stub it and assert it runs.
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));
// attach-window-to-request reaches for `windows` directly. Stub the module so
// the dedicated attach branch can be exercised without a browser.
jest.mock('webextension-polyfill', () => ({
  windows: { get: jest.fn().mockResolvedValue({ id: 7 }), getAll: jest.fn() },
  runtime: { id: 'ext-id', getURL: () => 'chrome-extension://ext-id/' }
}));

// An extension UI page: same extension id, URL under the extension origin.
const trustedSender = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html'
} as Runtime.MessageSender;

const enableOnboardingFlowMock = enableOnboardingFlow as jest.MockedFunction<
  typeof enableOnboardingFlow
>;

function makeStore() {
  const dispatch = jest.fn();
  const store = { dispatch } as unknown as MainStore;
  return { store, dispatch };
}

beforeEach(() => {
  enableOnboardingFlowMock.mockClear();
  // `windows.get` is asserted on per test (the attach branch probes it), so its
  // call history must not leak between them.
  (windows.get as jest.Mock).mockClear();
});

describe('handleReduxAction forwarding gate (fail-closed)', () => {
  it('resetVault → dispatches and re-enables the onboarding flow', async () => {
    const { store, dispatch } = makeStore();
    const action = { type: resetVault.type };

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(action);
    expect(enableOnboardingFlowMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('windowRequestWindowAttached → handled by its own branch, which verifies the window', async () => {
    // It must reach the store (the Ledger hook dispatches it from a UI page),
    // but through the branch that probes the window rather than through the
    // blind forwarding set — a dead or invented windowId would otherwise make
    // the request permanently uncancellable.
    const { store, dispatch } = makeStore();
    const action = windowRequestWindowAttached({
      requestId: 'r1',
      windowId: 7
    });

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(windows.get).toHaveBeenCalledWith(7, { populate: true });
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('an attach from an untrusted sender is dropped before it reaches the store', async () => {
    // Attaching a window is what decides whether a request can ever be
    // cancelled: a live-but-unrelated windowId gives a set that never shrinks
    // to empty (permanently uncancellable), a dead one gives a set of exactly
    // [dead] that the cancel path then selects on status alone. That is a
    // lifecycle-authority decision, and it was the one handler path with no
    // sender gate — unlike its siblings handleSdkResponseToTab and
    // handleLegacyImport, which are pulled out of the generic loop precisely
    // to gate on it.
    const { store, dispatch } = makeStore();
    const action = windowRequestWindowAttached({
      requestId: 'r1',
      windowId: 7
    });

    const result = await handleReduxAction(
      action,
      {
        id: 'ext-id',
        url: 'https://dapp.example/page'
      } as Runtime.MessageSender,
      store
    );

    expect(dispatch).not.toHaveBeenCalled();
    expect(windows.get).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true });
  });

  it('a payload-less attach message is refused by the guard, not thrown out of the handler', async () => {
    // `.match` is `isAction(action) && action.type === type` — it does not
    // validate the payload. Reading `action.payload.requestId` before
    // `attachWindowToRequest`'s own shape guard runs turns the most obvious
    // malformed shape into a TypeError that the router reports as a generic
    // sendError, instead of the intended "ignoring malformed attach".
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { store, dispatch } = makeStore();

    const result = await handleReduxAction(
      { type: windowRequestWindowAttached.type },
      trustedSender,
      store
    );

    expect(dispatch).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      'attachWindowToRequest: ignoring malformed attach',
      expect.any(Object)
    );
    expect(result).toEqual({ handled: true, response: undefined });
    consoleError.mockRestore();
  });

  it('a FORWARDED action type → dispatched to the real store', async () => {
    const { store, dispatch } = makeStore();
    const action = lockVault(); // type is in FORWARDED_ACTION_TYPES

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(action);
    expect(enableOnboardingFlowMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('another FORWARDED type (payload-carrying) → dispatched verbatim', async () => {
    const { store, dispatch } = makeStore();
    const action = accountRenamed({ name: 'a', newName: 'b' } as any);

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('dismissSagaError → forwarded to the store (dismiss button must work)', async () => {
    const { store, dispatch } = makeStore();
    const action = dismissSagaError(1);

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).toHaveBeenCalledWith(action);
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('backgroundEvent.popupStateUpdated → handled but NEVER dispatched or responded', async () => {
    const { store, dispatch } = makeStore();
    const action = backgroundEvent.popupStateUpdated({} as any);

    const result = await handleReduxAction(action, trustedSender, store);

    expect(dispatch).not.toHaveBeenCalled();
    // handled:true with no response — promise stays pending on purpose
    expect(result).toEqual({ handled: true });
    expect(result).not.toHaveProperty('response');
  });

  it('unknown / non-forwarded action type → { handled: false }, NOT dispatched (fail-closed)', async () => {
    const { store, dispatch } = makeStore();

    const result = await handleReduxAction(
      { type: 'SOME_ARBITRARY_UNLISTED_ACTION' },
      trustedSender,
      store
    );

    expect(dispatch).not.toHaveBeenCalled();
    expect(enableOnboardingFlowMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: false });
  });
});
