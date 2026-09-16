import { Runtime, tabs } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { Request } from '@background/redux/windowManagement/types';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';
import { unknownSdkMessageError } from '@content/unknown-message-errors';

import { handleSdkResponseToTab } from './sdk-response-to-tab';

// `webextension-polyfill` throws outside a browser extension. Stub the only API
// the handler touches so the module can load and we can spy delivery.
jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn(), get: jest.fn() },
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

// The same-origin fallback delegates to this util; stub it so we can assert it
// is (or isn't) invoked. It resolves to the COUNT of tabs it delivered to.
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

const sendMessageMock = tabs.sendMessage as jest.MockedFunction<
  typeof tabs.sendMessage
>;

const getTabMock = tabs.get as jest.MockedFunction<typeof tabs.get>;

const emitToOriginMock =
  emitSdkEventToActiveTabsWithOrigin as jest.MockedFunction<
    typeof emitSdkEventToActiveTabsWithOrigin
  >;

const DAPP_ORIGIN = 'https://dapp.example';

const REQUEST_ID = 'req-1';
const TAB_ID = 7;

// Message-text fragments the handler surfaces via `sagaError`, keyed on whether
// the same-origin fallback actually delivered.
const DELIVERED_MSG = 'delivered via same-origin fallback';
const NOT_DELIVERED_MSG =
  'no same-origin fallback available — response not delivered';

// Passes `isTrustedUiSender`: our id, url under the extension origin.
const UI_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html'
} as Runtime.MessageSender;

// Trusted UI sender whose page URL carries the dapp origin in `?origin=` — how
// the handler recovers the origin for the same-origin fallback.
const UI_SENDER_WITH_ORIGIN = {
  id: 'ext-id',
  url: `chrome-extension://ext-id/signature-request.html?requestId=${REQUEST_ID}&origin=${DAPP_ORIGIN}&tabId=${TAB_ID}#/SignMessage`
} as Runtime.MessageSender;

// A live, still-open approval request — the status every real request has while
// the user has not answered yet.
const OPEN_REQUEST: Request = {
  status: 'open',
  tabId: TAB_ID,
  origin: DAPP_ORIGIN,
  method: 'sign',
  windowIds: [7],
  awaitingDeviceConfirmation: false,
  seq: 0
};

function makeStore(request?: Request, ledgerWindowId: number | null = null) {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      ledger: { windowId: ledgerWindowId },
      windowManagement: {
        windowId: null,
        exportKeysWindowId: null,
        requests: request ? { [REQUEST_ID]: request } : {}
      }
    }),
    dispatch
  } as unknown as MainStore;
  return { store, dispatch };
}

// Stateful store: `dispatch` applies `windowRequestResponded` to the `requests`
// map, so a subsequent `selectRequestStatus` reflects the optimistic mark.
function makeStatefulStore() {
  const requests: Record<string, Request> = { [REQUEST_ID]: OPEN_REQUEST };
  const dispatch = jest.fn((action: { payload?: { requestId?: string } }) => {
    const id = action?.payload?.requestId;
    if (id != null) {
      requests[id] = { status: 'responded', seq: 0 };
    }
  });
  const store = {
    getState: () => ({
      ledger: { windowId: null },
      windowManagement: { windowId: null, exportKeysWindowId: null, requests }
    }),
    dispatch
  } as unknown as MainStore;
  return { store, dispatch };
}

function makeMessage(tabId: number = TAB_ID): SdkResponseToTabMessage {
  return {
    type: SDK_RESPONSE_TO_TAB,
    action: sdkMethod.signResponse(
      { signatureHex: 'deadbeef', cancelled: false },
      { requestId: REQUEST_ID }
    ),
    tabId
  };
}

// The content script's `Error.message`, as a rejecting `tabs.sendMessage` hands
// it back — real constructor, so dropping that redaction fails the tests here.
function deliveryRejection(): Error {
  return unknownSdkMessageError(makeMessage().action);
}

function makeCancelMessage(tabId: number = TAB_ID): SdkResponseToTabMessage {
  return {
    type: SDK_RESPONSE_TO_TAB,
    action: sdkMethod.signResponse(
      { cancelled: true },
      { requestId: REQUEST_ID }
    ),
    tabId
  };
}

// Everything a spy actually wrote, as text. `JSON.stringify` alone cannot see an
// Error's `message` (non-enumerable), and the third log argument IS an Error.
function loggedText(spy: jest.SpyInstance) {
  return spy.mock.calls
    .flat()
    .map(arg => (arg instanceof Error ? arg.message : JSON.stringify(arg)))
    .join(' ');
}

function findSagaError(dispatch: jest.Mock) {
  return dispatch.mock.calls.find(
    ([a]) => a?.payload?.source === 'sdk-response-to-tab'
  )?.[0];
}

describe('handleSdkResponseToTab (background dedupe of SDK responses)', () => {
  // The nested `describe` installs its own spies on top of these and restores
  // them first, so both coexist.
  let outerConsoleError: jest.SpyInstance;
  let outerConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    sendMessageMock.mockReset();
    sendMessageMock.mockResolvedValue(undefined);
    emitToOriginMock.mockReset();
    // Default: fallback delivers to one tab. Individual tests override with 0.
    emitToOriginMock.mockResolvedValue(1);
    getTabMock.mockReset();
    // Default: the tab still hosts the dapp that made the request.
    getTabMock.mockResolvedValue({ url: `${DAPP_ORIGIN}/app` } as never);
    outerConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    outerConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    outerConsoleError.mockRestore();
    outerConsoleWarn.mockRestore();
  });

  it('an open request → delivers to the tab AND marks responded', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    const message = makeMessage();

    const result = await handleSdkResponseToTab(message, UI_SENDER, store);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, message.action);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    expect(result.handled).toBe(true);
  });

  it("already 'responded' → drops a duplicate CANCEL with no send and no dispatch", async () => {
    const { store, dispatch } = makeStore({ status: 'responded', seq: 0 });

    const result = await handleSdkResponseToTab(
      makeCancelMessage(),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(result.handled).toBe(true);
  });

  it('delivers a response for a request that is still open', async () => {
    // `open` is the status every live request has when the user approves, so
    // widening `=== 'responded'` to `!= null` would drop real signatures.
    const { store } = makeStore(OPEN_REQUEST);

    await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  describe('a dropped duplicate is not one thing', () => {
    // A dropped cancel is benign and is the overwhelming majority; sharing one
    // severity with a dropped signature trains a reader to ignore both.
    let consoleError: jest.SpyInstance;
    let consoleWarn: jest.SpyInstance;

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });

    it('escalates a dropped completed response to error severity', async () => {
      const { store, dispatch } = makeStore({ status: 'responded', seq: 0 });

      await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'sdk-response-to-tab: dropped a completed response — the result was lost',
        { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) }
      );
      // Log-only: `SagaErrorBanner` renders `message` verbatim and untranslated,
      // so the user-facing half needs copy and an i18n key it does not have.
      expect(findSagaError(dispatch)).toBeUndefined();
      // Identifiers only, never the signed payload — in either channel.
      const logged = JSON.stringify([
        ...consoleError.mock.calls,
        ...dispatch.mock.calls
      ]);
      expect(logged).not.toContain('deadbeef');
    });

    it('only warns about a duplicate cancel, and does not bother the user', async () => {
      const { store, dispatch } = makeStore({ status: 'responded', seq: 0 });

      await handleSdkResponseToTab(makeCancelMessage(), UI_SENDER, store);

      expect(consoleWarn).toHaveBeenCalledWith(
        'sdk-response-to-tab: dropped a duplicate cancel',
        { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) }
      );
      expect(consoleError).not.toHaveBeenCalled();
      expect(findSagaError(dispatch)).toBeUndefined();
    });

    it('treats a bare `false` boolean answer as benign too', async () => {
      // `connectResponse` / `switchAccountResponse` type their payload as a
      // plain boolean, and `false` is what the reject buttons send.
      const { store } = makeStore({ status: 'responded', seq: 0 });

      await handleSdkResponseToTab(
        {
          type: SDK_RESPONSE_TO_TAB,
          action: sdkMethod.connectResponse(false, { requestId: REQUEST_ID }),
          tabId: TAB_ID
        },
        UI_SENDER,
        store
      );

      expect(consoleWarn).toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });

    it('escalates a dropped bare `true` boolean answer — it is an approval', async () => {
      // Both flows await their state change BEFORE sending, so a dropped `true`
      // leaves the wallet connected while the dapp was told the user rejected.
      const { store } = makeStore({ status: 'responded', seq: 0 });

      await handleSdkResponseToTab(
        {
          type: SDK_RESPONSE_TO_TAB,
          action: sdkMethod.switchAccountResponse(true, {
            requestId: REQUEST_ID
          }),
          tabId: TAB_ID
        },
        UI_SENDER,
        store
      );

      expect(consoleError).toHaveBeenCalledWith(
        'sdk-response-to-tab: dropped a completed response — the result was lost',
        { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) }
      );
      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  it('invalid tabId → the descriptor origin still drives the fallback', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(1);

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER,
      store
    );

    // No usable tab — but the descriptor knows the origin even though the
    // sender url carries none.
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage(-1).action
    );

    // Delivered → mark responded so a later duplicate dedupes.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError.payload.message).toContain(DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('invalid tabId, origin present, fallback delivers (1) → marks responded, "delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(1);

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    // No usable tab → no direct delivery, but the same-origin fallback fires.
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage(-1).action
    );

    // We DID deliver via the fallback → mark responded so a later duplicate is
    // deduped, plus surface the "delivered" sagaError.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('invalid tabId, origin present, fallback delivers ZERO → does NOT mark responded, "not delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(0);

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    // Fallback was attempted but matched zero tabs → nothing delivered.
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);

    // A legitimate retry must still deliver → do NOT mark responded.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('valid tabId, delivery rejects, origin present, fallback delivers (1) → optimistic responded + "delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    sendMessageMock.mockRejectedValue(deliveryRejection());
    emitToOriginMock.mockResolvedValue(1);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    // Recovered elsewhere → warn, distinct from the case where the signature
    // was destroyed.
    expect(outerConsoleWarn).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed; recovered via same-origin fallback',
      {
        requestId: REQUEST_ID,
        tabId: TAB_ID,
        type: sdkMethod.signResponse.type,
        delivered: 1
      },
      expect.any(Error)
    );
    expect(outerConsoleError).not.toHaveBeenCalled();
    // SECURITY: the Error argument is included, and this branch fires whenever
    // another same-origin tab is open, i.e. the common outcome.
    expect(loggedText(outerConsoleWarn)).not.toContain('deadbeef');
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action);

    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage().action
    );

    // Optimistic mark happened BEFORE the await (atomic dedupe contract).
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(DELIVERED_MSG);

    // SECURITY: no signature material in the surfaced error.
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');
    expect(sagaError.payload.message).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('valid tabId, delivery rejects, origin present, fallback delivers ZERO → optimistic responded + "not delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    sendMessageMock.mockRejectedValue(deliveryRejection());
    emitToOriginMock.mockResolvedValue(0);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed; response not delivered',
      {
        requestId: REQUEST_ID,
        tabId: TAB_ID,
        type: sdkMethod.signResponse.type,
        delivered: 0
      },
      expect.any(Error)
    );

    // The optimistic mark is load-bearing: still dispatched before the await.
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('delivery rejects and the sender url has no origin → the descriptor origin recovers it', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    sendMessageMock.mockRejectedValue(deliveryRejection());
    emitToOriginMock.mockResolvedValue(1);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage().action
    );
    expect(outerConsoleWarn).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed; recovered via same-origin fallback',
      {
        requestId: REQUEST_ID,
        tabId: TAB_ID,
        type: sdkMethod.signResponse.type,
        delivered: 1
      },
      expect.any(Error)
    );
    expect(loggedText(outerConsoleWarn)).not.toContain('deadbeef');
    expect(findSagaError(dispatch).payload.message).toContain(DELIVERED_MSG);

    expect(result.handled).toBe(true);
  });

  it('never puts the response payload in the delivery-failure log', async () => {
    const { store } = makeStore(OPEN_REQUEST);
    sendMessageMock.mockRejectedValue(deliveryRejection());
    emitToOriginMock.mockResolvedValue(0);

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    // The check has to see inside the Error argument too — that is the part
    // whose text this code does not control.
    expect(loggedText(outerConsoleError)).not.toContain('deadbeef');
    expect(outerConsoleError.mock.calls[0][1]).toEqual({
      requestId: REQUEST_ID,
      tabId: TAB_ID,
      type: sdkMethod.signResponse.type,
      delivered: 0
    });
  });

  it('fallback emit THROWS (valid tab path) → handler still resolves, "not delivered" sagaError, does not reject', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    sendMessageMock.mockRejectedValue(deliveryRejection());
    emitToOriginMock.mockRejectedValue(new Error('tabs.query blew up'));

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    // The emit rejection is swallowed → the error-surface dispatch still runs.
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    // A throw and "no same-origin tab was open" both return 0, and the caller
    // picks its banner copy from that 0.
    expect(outerConsoleError).toHaveBeenCalledWith(
      'deliverViaOrigin: same-origin fallback failed',
      { origin: DAPP_ORIGIN, type: sdkMethod.signResponse.type },
      expect.any(Error)
    );
    expect(loggedText(outerConsoleError)).not.toContain('deadbeef');
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('fallback emit THROWS (invalid tab path) → handler still resolves, no responded, "not delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockRejectedValue(new Error('tabs.query blew up'));

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'deliverViaOrigin: same-origin fallback failed',
      { origin: DAPP_ORIGIN, type: sdkMethod.signResponse.type },
      expect.any(Error)
    );
    expect(loggedText(outerConsoleError)).not.toContain('deadbeef');
    // Nothing delivered → NOT marked responded.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);

    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('atomic dedupe: a second response arriving while the first send is still in-flight is dropped', async () => {
    const { store } = makeStatefulStore();
    // First send never resolves — simulates the delivery being in-flight while
    // the second (beforeunload-cancel) message is processed by the router.
    sendMessageMock.mockReturnValue(new Promise(() => {}));

    // Do NOT await — the first handler yields before the send, having already
    // dispatched `windowRequestResponded` synchronously.
    const first = handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    // Second message for the SAME requestId, processed while the first is still
    // in flight: it must read status 'responded' and drop.
    const secondResult = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(secondResult).toEqual({ handled: true, response: undefined });

    // The first invocation yields at the live-origin read before it sends. A
    // macrotask, not a microtask: that continuation takes more than one tick.
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(sendMessageMock).toHaveBeenCalledTimes(1);

    void first; // keep the first (pending) invocation referenced
  });

  it('non-matching message.type → { handled: false } (passes to the next handler)', async () => {
    const { store } = makeStore(OPEN_REQUEST);

    const result = await handleSdkResponseToTab(
      { type: 'SomethingElse' } as unknown as SdkResponseToTabMessage,
      UI_SENDER,
      store
    );

    expect(result.handled).toBe(false);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it('untrusted sender → dropped (handled, no delivery, no dispatch)', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    const untrustedSender = {
      id: 'other-ext',
      url: 'https://evil.example/page'
    } as Runtime.MessageSender;

    const result = await handleSdkResponseToTab(
      makeMessage(),
      untrustedSender,
      store
    );

    expect(result).toEqual({ handled: true });
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('no descriptor (residual descriptor-less path) → still delivers, dispatches nothing', async () => {
    // Every approval-window url carries `?origin=`, so a descriptor-less
    // response can still be verified against the live tab.
    const { store, dispatch } = makeStore(undefined);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('a response whose tabId is not the requesting tab is never sent to it', async () => {
    // The request was opened from tab 7 (OPEN_REQUEST); the response claims 3.
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(0);

    const result = await handleSdkResponseToTab(
      makeMessage(3),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).not.toHaveBeenCalled();
    // The descriptor's origin drives the fallback, and it is attempted.
    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage(3).action
    );

    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);
    // Nothing delivered → a valid retry must still be able to.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');
    expect(loggedText(outerConsoleError)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('a tab mismatch whose fallback DID deliver marks the request responded', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(1);

    await handleSdkResponseToTab(makeMessage(3), UI_SENDER_WITH_ORIGIN, store);

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    expect(findSagaError(dispatch).payload.message).toContain(DELIVERED_MSG);
  });

  it('a tab-mismatch fallback for a sub-frame request is not broadcast', async () => {
    // `deliverViaOrigin`'s sub-frame guard only fires if the descriptor's
    // `frameId` reaches it; this pins that argument at the tab-mismatch call.
    const { store } = makeStore({ ...OPEN_REQUEST, frameId: 4 });

    await handleSdkResponseToTab(makeMessage(3), UI_SENDER_WITH_ORIGIN, store);

    expect(emitToOriginMock).not.toHaveBeenCalled();
  });

  it('withholds the response when the tab navigated to another origin', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    getTabMock.mockResolvedValue({
      url: 'https://evil.example/landing'
    } as never);
    emitToOriginMock.mockResolvedValue(0);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'sdk-response-to-tab: target tab no longer hosts the requesting origin; response withheld',
      {
        requestId: REQUEST_ID,
        tabId: TAB_ID,
        expectedOrigin: DAPP_ORIGIN,
        liveOrigin: 'https://evil.example',
        type: sdkMethod.signResponse.type,
        delivered: 0
      }
    );
    expect(findSagaError(dispatch).payload.message).toContain(
      NOT_DELIVERED_MSG
    );
    // SECURITY: neither channel may carry the signature.
    expect(loggedText(outerConsoleError)).not.toContain('deadbeef');
    expect(JSON.stringify(dispatch.mock.calls)).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('withholds the response when the tab is gone', async () => {
    const { store, dispatch } = makeStore(OPEN_REQUEST);
    getTabMock.mockRejectedValue(new Error('No tab with id: 7'));
    emitToOriginMock.mockResolvedValue(0);

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(findSagaError(dispatch)).toBeDefined();
  });

  it('withholds the response when no origin can be established', async () => {
    // No descriptor (a residual descriptor-less path) AND a sender url with
    // no ?origin= param.
    const { store, dispatch } = makeStore();

    await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    expect(sendMessageMock).not.toHaveBeenCalled();
    // `deliverViaOrigin` returns 0 at its `if (!origin) return 0` guard —
    // no fallback is even attempted.
    expect(emitToOriginMock).not.toHaveBeenCalled();
    expect(findSagaError(dispatch)).toBeDefined();
  });

  it('the descriptor origin wins over the sender url origin when they differ', async () => {
    // Elsewhere the descriptor and the sender url carry the same origin, so an
    // inverted `??` precedence would keep everything green.
    const senderWithOtherOrigin = {
      id: 'ext-id',
      url: `chrome-extension://ext-id/signature-request.html?requestId=${REQUEST_ID}&origin=https://impostor.example&tabId=${TAB_ID}#/SignMessage`
    } as Runtime.MessageSender;
    const { store } = makeStore(OPEN_REQUEST);
    emitToOriginMock.mockResolvedValue(1);

    // tabId 3 !== OPEN_REQUEST.tabId (7) forces the tab-mismatch fallback path.
    await handleSdkResponseToTab(makeMessage(3), senderWithOtherOrigin, store);

    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage(3).action
    );
  });

  it('a sub-frame request does not consult the tab origin', async () => {
    // `tabs.get` reports the TOP document url; a sub-frame request's origin is
    // the frame's own, so comparing them would refuse every iframe dapp.
    const { store } = makeStore({ ...OPEN_REQUEST, frameId: 4 });

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(getTabMock).not.toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  it('delivers to the requesting frame only', async () => {
    const { store } = makeStore({ ...OPEN_REQUEST, frameId: 4 });

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action, {
      frameId: 4
    });
  });

  it('scopes a top-frame request to frame 0', async () => {
    const { store } = makeStore({ ...OPEN_REQUEST, frameId: 0 });

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(getTabMock).toHaveBeenCalledWith(TAB_ID);
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action, {
      frameId: 0
    });
  });

  it('a descriptor with no frame keeps the unscoped send', async () => {
    const { store } = makeStore(OPEN_REQUEST);

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action);
  });

  it('the same-origin fallback for a top-frame request targets frame 0', async () => {
    const { store } = makeStore({ ...OPEN_REQUEST, frameId: 0 });
    sendMessageMock.mockRejectedValue(deliveryRejection());

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(emitToOriginMock).toHaveBeenCalledWith(
      DAPP_ORIGIN,
      makeMessage().action,
      0
    );
  });

  it('the same-origin fallback is never attempted for a sub-frame request', async () => {
    // Frame ids are per-tab: a sub-frame id means nothing in another tab, so
    // broadcasting could deliver to a document that never asked.
    const { store, dispatch } = makeStore({ ...OPEN_REQUEST, frameId: 4 });
    sendMessageMock.mockRejectedValue(deliveryRejection());

    await handleSdkResponseToTab(makeMessage(), UI_SENDER_WITH_ORIGIN, store);

    expect(emitToOriginMock).not.toHaveBeenCalled();
    expect(findSagaError(dispatch).payload.message).toContain(
      NOT_DELIVERED_MSG
    );
  });
});
