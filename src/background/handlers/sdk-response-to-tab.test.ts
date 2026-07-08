import { Runtime, tabs } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { RequestStatus } from '@background/redux/windowManagement/types';
import {
  SDK_RESPONSE_TO_TAB,
  SdkResponseToTabMessage
} from '@background/send-sdk-response-to-specific-tab';

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

const sendMessageMock = tabs.sendMessage as jest.MockedFunction<
  typeof tabs.sendMessage
>;

const REQUEST_ID = 'req-1';
const TAB_ID = 7;

// Trusted extension-UI sender (id matches runtime.id, url under the extension
// origin) — passes `isTrustedUiSender`.
const UI_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html'
} as Runtime.MessageSender;

// Build a fake store whose `requests` map carries the desired status for the
// request under test, plus a spied dispatch.
function makeStore(status?: RequestStatus) {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      windowManagement: {
        windowId: null,
        requests: status ? { [REQUEST_ID]: status } : {}
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
  const requests: Record<string, RequestStatus> = {};
  const dispatch = jest.fn((action: { payload?: { requestId?: string } }) => {
    const id = action?.payload?.requestId;
    if (id != null) {
      requests[id] = 'responded';
    }
  });
  const store = {
    getState: () => ({ windowManagement: { windowId: null, requests } }),
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

describe('handleSdkResponseToTab (background dedupe of SDK responses)', () => {
  beforeEach(() => {
    sendMessageMock.mockReset();
    sendMessageMock.mockResolvedValue(undefined);
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

  it("already 'responded' → drops the duplicate (no send, no dispatch)", async () => {
    const { store, dispatch } = makeStore('responded');

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(result.handled).toBe(true);
  });

  it("'closed' (never responded) → still delivers (must NOT drop — beforeunload-cancel race)", async () => {
    const { store } = makeStore('closed');

    const result = await handleSdkResponseToTab(
      makeMessage(),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledWith(TAB_ID, makeMessage().action);
    expect(result.handled).toBe(true);
  });

  it('invalid tabId → no delivery, no throw', async () => {
    const { store, dispatch } = makeStore(undefined);

    const result = await handleSdkResponseToTab(
      makeMessage(-1),
      UI_SENDER,
      store
    );

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(result.handled).toBe(true);
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
