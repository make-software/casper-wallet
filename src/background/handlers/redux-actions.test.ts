import { Runtime, windows } from 'webextension-polyfill';

import { backgroundEvent } from '@background/background-events';
import { enableOnboardingFlow } from '@background/open-onboarding-flow';
import { dismissSagaError } from '@background/redux/app-events/actions';
import { MainStore } from '@background/redux/get-main-store';
import { closeLedgerFlowWindows } from '@background/redux/ledger/actions';
import { lockVault, resetVault } from '@background/redux/sagas/actions';
import { accountRenamed } from '@background/redux/vault/actions';
import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { handleCloseLedgerFlowWindows } from './close-ledger-flow-windows';
import { handleReduxAction } from './redux-actions';

// enableOnboardingFlow touches webextension-polyfill; stub it and assert it runs.
jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('./close-ledger-flow-windows', () => ({
  handleCloseLedgerFlowWindows: jest.fn().mockResolvedValue(undefined)
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

// The same, displaying request `r1` — every window a dapp flow opens carries the
// id in its query string, the approval window and the permission window alike.
const trustedSenderForR1 = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/signature-request.html?requestId=r1&origin=https%3A%2F%2Fdapp.example#/sign-deploy'
} as Runtime.MessageSender;

const enableOnboardingFlowMock = enableOnboardingFlow as jest.MockedFunction<
  typeof enableOnboardingFlow
>;

const closeLedgerFlowWindowsMock =
  handleCloseLedgerFlowWindows as jest.MockedFunction<
    typeof handleCloseLedgerFlowWindows
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
  closeLedgerFlowWindowsMock.mockClear();
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

  it('closeLedgerFlowWindows → routed to its handler, never dispatched into the store', async () => {
    // It must NOT reach the forwarding set: there is no reducer case for it, and
    // closing windows is a lifecycle decision that needs the requests map.
    const { store, dispatch } = makeStore();
    const action = closeLedgerFlowWindows({
      requestId: 'r1',
      permissionWindowId: 20
    });

    const result = await handleReduxAction(action, trustedSenderForR1, store);

    expect(closeLedgerFlowWindowsMock).toHaveBeenCalledWith(store, {
      requestId: 'r1',
      permissionWindowId: 20
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('closeLedgerFlowWindows without a requestId is routed with undefined', async () => {
    // The internal flows (import-account-from-ledger, sign-with-ledger-in-new-window)
    // have no dapp request behind them and legitimately send no requestId — and
    // their page URL carries none either, so the two still agree.
    const { store } = makeStore();

    await handleReduxAction(
      closeLedgerFlowWindows({ permissionWindowId: 20 }),
      trustedSender,
      store
    );

    expect(closeLedgerFlowWindowsMock).toHaveBeenCalledWith(store, {
      requestId: undefined,
      permissionWindowId: 20
    });
  });

  it('closeLedgerFlowWindows from an untrusted sender is dropped', async () => {
    // Closing an approval window reaches cancel-on-close and cancels the request
    // it displayed — a lifecycle-authority decision, gated like its siblings.
    const { store } = makeStore();
    const action = closeLedgerFlowWindows({ requestId: 'r1' });

    const result = await handleReduxAction(
      action,
      { id: 'other-ext', url: 'https://evil.example' } as Runtime.MessageSender,
      store
    );

    expect(closeLedgerFlowWindowsMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true });
  });

  it('a trusted page naming a request it does not display is dropped', async () => {
    // The sender gate admits every wallet page and stops there, so on its own it
    // lets the export-keys window close a live dapp approval. The handler does
    // not consult `method` either: connect / switchAccount / decryptMessage would
    // be torn down exactly like a Ledger sign.
    const { store } = makeStore();

    const result = await handleReduxAction(
      closeLedgerFlowWindows({ requestId: 'r1' }),
      trustedSender,
      store
    );

    expect(closeLedgerFlowWindowsMock).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true });
  });

  it('a trusted page omitting the id its own URL carries is dropped', async () => {
    const { store } = makeStore();

    await handleReduxAction(
      closeLedgerFlowWindows({ permissionWindowId: 20 }),
      trustedSenderForR1,
      store
    );

    expect(closeLedgerFlowWindowsMock).not.toHaveBeenCalled();
  });

  it('an unparseable sender URL reads as "no request", so a named one is dropped', async () => {
    const { store } = makeStore();

    await handleReduxAction(
      closeLedgerFlowWindows({ requestId: 'r1' }),
      { id: 'ext-id', url: undefined } as Runtime.MessageSender,
      store
    );

    expect(closeLedgerFlowWindowsMock).not.toHaveBeenCalled();
  });

  it('a payload-less closeLedgerFlowWindows message does not throw', async () => {
    // `.match` checks the type, not the payload; the message crosses runtime.sendMessage.
    const { store } = makeStore();

    const result = await handleReduxAction(
      { type: closeLedgerFlowWindows.type },
      trustedSender,
      store
    );

    expect(closeLedgerFlowWindowsMock).toHaveBeenCalledWith(store, {
      requestId: undefined,
      permissionWindowId: undefined
    });
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('a synchronous throw from the handler is caught and logged, not left unhandled', async () => {
    // `handleCloseLedgerFlowWindows` never rejects per its own contract, but the
    // branch is fire-and-forget from a service worker, where an unhandled
    // rejection is invisible — the `.catch` is the belt or a broken contract.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { store } = makeStore();
    const error = new Error('boom');
    closeLedgerFlowWindowsMock.mockRejectedValueOnce(error);

    const result = await handleReduxAction(
      closeLedgerFlowWindows({ requestId: 'r1' }),
      trustedSenderForR1,
      store
    );
    // The rejection is caught off the fire-and-forget promise, not awaited by
    // the handler itself — let the microtask queue drain before asserting.
    await new Promise(resolve => setImmediate(resolve));

    expect(result).toEqual({ handled: true, response: undefined });
    expect(consoleError).toHaveBeenCalledWith(
      'closeLedgerFlowWindows: handler failed',
      error
    );
    consoleError.mockRestore();
  });
});
