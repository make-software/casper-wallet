import { Runtime, tabs } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { Request } from '@background/redux/windowManagement/types';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';

import { handleSdkResponseToTab } from './sdk-response-to-tab';

// `webextension-polyfill` throws outside a browser extension. Stub the only API
// the handler touches so the module can load and we can spy delivery.
jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() },
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

// The same-origin fallback delegates to this util; stub it so we can assert it
// is (or isn't) invoked without touching real `tabs.query`. It now resolves to
// the COUNT of tabs it successfully delivered to.
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

const sendMessageMock = tabs.sendMessage as jest.MockedFunction<
  typeof tabs.sendMessage
>;

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

// Trusted extension-UI sender (id matches runtime.id, url under the extension
// origin) — passes `isTrustedUiSender`.
const UI_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html'
} as Runtime.MessageSender;

// Trusted UI sender whose page URL carries the dapp origin in its `?origin=`
// query param — the mechanism the handler uses to recover the origin for the
// same-origin fallback (no new state / message field is threaded).
const UI_SENDER_WITH_ORIGIN = {
  id: 'ext-id',
  url: `chrome-extension://ext-id/signature-request.html?requestId=${REQUEST_ID}&origin=${DAPP_ORIGIN}&tabId=${TAB_ID}#/SignMessage`
} as Runtime.MessageSender;

// A live, still-open approval request — the status every real request has
// while the user is looking at the approval window and hasn't answered yet.
const OPEN_REQUEST: Request = {
  status: 'open',
  tabId: TAB_ID,
  origin: DAPP_ORIGIN,
  method: 'sign',
  windowIds: [7]
};

// Build a fake store whose `requests` map carries the desired request entry
// for the request under test, plus a spied dispatch.
function makeStore(request?: Request) {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({
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

// Stateful store: `dispatch` actually applies `windowRequestResponded` to the
// `requests` map, so a subsequent `selectRequestStatus` reflects the optimistic
// mark. Used to prove the dedupe is atomic across an in-flight (un-awaited) send.
function makeStatefulStore() {
  const requests: Record<string, Request> = {};
  const dispatch = jest.fn((action: { payload?: { requestId?: string } }) => {
    const id = action?.payload?.requestId;
    if (id != null) {
      requests[id] = { status: 'responded' };
    }
  });
  const store = {
    getState: () => ({
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

// Find the single `sagaError` dispatch (source === 'sdk-response-to-tab').
function findSagaError(dispatch: jest.Mock) {
  return dispatch.mock.calls.find(
    ([a]) => a?.payload?.source === 'sdk-response-to-tab'
  )?.[0];
}

describe('handleSdkResponseToTab (background dedupe of SDK responses)', () => {
  // The delivery paths below log their cause. The nested `describe` installs its
  // own spies on top of this one and restores them first, so both coexist.
  let outerConsoleError: jest.SpyInstance;

  beforeEach(() => {
    sendMessageMock.mockReset();
    sendMessageMock.mockResolvedValue(undefined);
    emitToOriginMock.mockReset();
    // Default: fallback delivers to one tab. Individual tests override with 0.
    emitToOriginMock.mockResolvedValue(1);
    outerConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    outerConsoleError.mockRestore();
  });

  it('fresh request (no prior status) → delivers to the tab AND marks responded', async () => {
    const { store, dispatch } = makeStore(undefined);
    const message = makeMessage();

    const result = await handleSdkResponseToTab(message, UI_SENDER, store);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, message.action);
    expect(dispatch).toHaveBeenCalledTimes(1);
    // windowRequestResponded({ requestId })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );
    expect(result.handled).toBe(true);
  });

  it("already 'responded' → drops a duplicate CANCEL with no send and no dispatch", async () => {
    const { store, dispatch } = makeStore({ status: 'responded' });

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
    // No test in this file used status 'open' before — the status every live
    // request has when the user approves. `=== 'responded'` widened to
    // `!= null` would silently drop real signatures and no test would notice.
    const { store } = makeStore(OPEN_REQUEST);

    await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  describe('a dropped duplicate is not one thing', () => {
    // The comment here claimed a dropped `cancelled: true` is benign while a
    // dropped signature never is, "and the two are distinguishable here" — then
    // both took the identical console.error and neither reached the user. The
    // benign case is the overwhelming majority of these lines, which trains a
    // reader to ignore the one that means a signed transaction was destroyed.
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
      const { store, dispatch } = makeStore({ status: 'responded' });

      await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

      expect(sendMessageMock).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        'sdk-response-to-tab: dropped a completed response — the result was lost',
        { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) }
      );
      // Log-only by decision: `SagaErrorBanner` renders `message` verbatim and
      // untranslated over the approval screens, so the user-facing half needs
      // copy and an i18n key it does not have yet.
      expect(findSagaError(dispatch)).toBeUndefined();
      // Identifiers only, never the signed payload — in either channel.
      const logged = JSON.stringify([
        ...consoleError.mock.calls,
        ...dispatch.mock.calls
      ]);
      expect(logged).not.toContain('deadbeef');
    });

    it('only warns about a duplicate cancel, and does not bother the user', async () => {
      const { store, dispatch } = makeStore({ status: 'responded' });

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
      // plain boolean, so a branch on `payload.cancelled` does not generalise
      // across the union. `false` is what `buildCancelResponse` and the reject
      // buttons send — nothing is lost by dropping it.
      const { store } = makeStore({ status: 'responded' });

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
      // The asymmetry this closes: `approve-connection` awaits
      // `connectAccounts(...)` and `switch-account` awaits
      // `changeActiveAccount(...)` BEFORE sending, so a dropped `true` leaves
      // the wallet listing the site as connected while the dapp was told the
      // user rejected. Classifying it as a cancel logs the exact opposite of
      // what happened.
      const { store } = makeStore({ status: 'responded' });

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

  it('invalid tabId, no origin → surfaces "not delivered" sagaError, no delivery, does not mark responded', async () => {
    const { store, dispatch } = makeStore(undefined);

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER,
      store
    );

    // No usable tab and no origin to fall back to: nothing is delivered and the
    // request is NOT marked responded (a valid retry must still deliver).
    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(emitToOriginMock).not.toHaveBeenCalled();

    // Exactly one dispatch: the non-fatal sagaError making the loss visible.
    expect(dispatch).toHaveBeenCalledTimes(1);
    const dispatched = findSagaError(dispatch);
    expect(dispatched).toBeDefined();
    expect(dispatched.payload.source).toBe('sdk-response-to-tab');
    // The message must state the response was NOT delivered.
    expect(dispatched.payload.message).toContain(NOT_DELIVERED_MSG);
    // No windowRequestResponded was dispatched.
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: { requestId: REQUEST_ID } })
    );

    // SECURITY: the surfaced error must not leak signature material.
    expect(JSON.stringify(dispatched)).not.toContain('deadbeef');
    expect(dispatched.payload.message).not.toContain('deadbeef');

    expect(result.handled).toBe(true);
  });

  it('invalid tabId, origin present, fallback delivers (1) → marks responded, "delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(undefined);
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
    const { store, dispatch } = makeStore(undefined);
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
    const { store, dispatch } = makeStore(undefined);
    sendMessageMock.mockRejectedValue(new Error('no listener / tab gone'));
    emitToOriginMock.mockResolvedValue(1);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    // Direct delivery was attempted (and rejected).
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed',
      { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) },
      expect.any(Error)
    );
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action);

    // Fallback broadcast to the same-origin active tab.
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
    const { store, dispatch } = makeStore(undefined);
    sendMessageMock.mockRejectedValue(new Error('no listener / tab gone'));
    emitToOriginMock.mockResolvedValue(0);

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed',
      { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) },
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

  it('valid tabId, delivery rejects, sender has NO origin → "not delivered" sagaError but no fallback', async () => {
    const { store, dispatch } = makeStore(undefined);
    sendMessageMock.mockRejectedValue(new Error('no listener / tab gone'));

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'sdk-response-to-tab: delivery to tab failed',
      { requestId: REQUEST_ID, tabId: TAB_ID, type: expect.any(String) },
      expect.any(Error)
    );
    // No origin recoverable → no fallback broadcast.
    expect(emitToOriginMock).not.toHaveBeenCalled();

    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);

    expect(result.handled).toBe(true);
  });

  it('never puts the response payload in the delivery-failure log', async () => {
    const { store } = makeStore(undefined);
    sendMessageMock.mockRejectedValue(new Error('no listener / tab gone'));

    await handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    // This log is the newest place that could leak the signed payload.
    expect(JSON.stringify(outerConsoleError.mock.calls)).not.toContain(
      'deadbeef'
    );
    expect(outerConsoleError.mock.calls[0][1]).toEqual({
      requestId: REQUEST_ID,
      tabId: TAB_ID,
      type: expect.any(String)
    });
  });

  it('fallback emit THROWS (valid tab path) → handler still resolves, "not delivered" sagaError, does not reject', async () => {
    const { store, dispatch } = makeStore(undefined);
    sendMessageMock.mockRejectedValue(new Error('no listener / tab gone'));
    emitToOriginMock.mockRejectedValue(new Error('tabs.query blew up'));

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    // The emit rejection is swallowed → the error-surface dispatch still runs.
    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    // ...but it is no longer indistinguishable from "no same-origin tab was
    // open": both return 0, and the caller picks banner copy from that 0.
    expect(outerConsoleError).toHaveBeenCalledWith(
      'deliverViaOrigin: same-origin fallback failed',
      { origin: DAPP_ORIGIN, type: expect.any(String) },
      expect.any(Error)
    );
    expect(JSON.stringify(outerConsoleError.mock.calls)).not.toContain(
      'deadbeef'
    );
    const sagaError = findSagaError(dispatch);
    expect(sagaError).toBeDefined();
    expect(sagaError.payload.message).toContain(NOT_DELIVERED_MSG);
    expect(JSON.stringify(sagaError)).not.toContain('deadbeef');

    expect(result).toEqual({ handled: true, response: undefined });
  });

  it('fallback emit THROWS (invalid tab path) → handler still resolves, no responded, "not delivered" sagaError', async () => {
    const { store, dispatch } = makeStore(undefined);
    emitToOriginMock.mockRejectedValue(new Error('tabs.query blew up'));

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER_WITH_ORIGIN,
      store
    );

    expect(emitToOriginMock).toHaveBeenCalledTimes(1);
    expect(outerConsoleError).toHaveBeenCalledWith(
      'deliverViaOrigin: same-origin fallback failed',
      { origin: DAPP_ORIGIN, type: expect.any(String) },
      expect.any(Error)
    );
    expect(JSON.stringify(outerConsoleError.mock.calls)).not.toContain(
      'deadbeef'
    );
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

    // Do NOT await — the first handler yields at `await tabs.sendMessage`, but
    // it has already dispatched `windowRequestResponded` synchronously.
    const first = handleSdkResponseToTab(makeMessage(), UI_SENDER, store);

    // Second message for the SAME requestId, processed during the first's
    // in-flight send. It must read status 'responded' and drop.
    const secondResult = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(secondResult).toEqual({ handled: true, response: undefined });
    // Exactly ONE delivery reached the tab — the duplicate was deduped.
    expect(sendMessageMock).toHaveBeenCalledTimes(1);

    void first; // keep the first (pending) invocation referenced
  });

  it('non-matching message.type → { handled: false } (passes to the next handler)', async () => {
    const { store } = makeStore(undefined);

    const result = await handleSdkResponseToTab(
      { type: 'SomethingElse' } as unknown as SdkResponseToTabMessage,
      UI_SENDER,
      store
    );

    expect(result.handled).toBe(false);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it('untrusted sender → dropped (handled, no delivery, no dispatch)', async () => {
    const { store, dispatch } = makeStore(undefined);
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
});
