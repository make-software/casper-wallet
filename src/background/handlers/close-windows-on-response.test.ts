import { Middleware, configureStore } from '@reduxjs/toolkit';
import { Runtime, tabs, windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerTransactionChanged
} from '@background/redux/ledger/actions';
import { reducer as ledger } from '@background/redux/ledger/reducer';
import {
  windowIdChanged,
  windowRequestOpened,
  windowRequestResponded,
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';
import { reducer as windowManagement } from '@background/redux/windowManagement/reducer';
import { SDK_RESPONSE_TO_TAB } from '@background/send-sdk-response-to-specific-tab';
import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';

import { CANCEL_GRACE_MS, cancelRequestsDisplacedBy } from './cancel-requests';
import {
  NOTHING_DISPLAYS,
  closeLedgerWindowsAfterResponse,
  markRequestResponded
} from './close-windows-on-response';
import { handleSdkResponseToTab } from './sdk-response-to-tab';
import { handleWindowRemoved } from './window-removed';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() },
  windows: { remove: jest.fn(), getAll: jest.fn(), get: jest.fn() },
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

const removeMock = windows.remove as jest.Mock;
const sendMessageMock = tabs.sendMessage as jest.Mock;
const emitToOriginMock =
  emitSdkEventToActiveTabsWithOrigin as jest.MockedFunction<
    typeof emitSdkEventToActiveTabsWithOrigin
  >;

const UI_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/signature-request.html'
} as Runtime.MessageSender;

// deliverViaOrigin is `if (!origin) return 0` (deliver-via-origin.ts:14) and origin is
// recoverDappOrigin(sender.url) (sdk-response-to-tab.ts:161-177), so only a sender carrying
// ?origin= ever reaches the emit mock. Mirrors UI_SENDER_WITH_ORIGIN at
// sdk-response-to-tab.test.ts:63.
const UI_SENDER_WITH_ORIGIN = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/signature-request.html?requestId=r1&origin=https://dapp.example&tabId=7#/SignTransaction'
} as Runtime.MessageSender;

const makeMessage = (requestId: string, tabId = 7) => ({
  type: SDK_RESPONSE_TO_TAB,
  action: sdkMethod.signResponse(
    { signatureHex: 'deadbeef', cancelled: false },
    { requestId }
  ),
  tabId
});

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

let order: string[];
let consoleError: jest.SpyInstance;

function makeRealStore() {
  const store = configureStore({
    reducer: { ledger, windowManagement },
    middleware: getDefault =>
      getDefault({ immutableCheck: false, serializableCheck: false }).concat(
        (() => (next: (action: unknown) => unknown) => (action: unknown) => {
          order.push(`dispatch:${(action as { type: string }).type}`);
          return next(action);
        }) as Middleware
      )
  });
  return store as unknown as MainStore;
}

function openWith(store: MainStore, requestId: string, windowIds: number[]) {
  store.dispatch(
    windowRequestOpened({
      requestId,
      tabId: 7,
      origin: 'https://dapp.example',
      method: 'sign'
    })
  );
  windowIds.forEach(windowId =>
    store.dispatch(windowRequestWindowAttached({ requestId, windowId }))
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  order = [];
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  removeMock.mockImplementation((id: number) => {
    order.push(`windows.remove:${id}`);
    return Promise.resolve();
  });
  sendMessageMock.mockImplementation(() => {
    order.push('tabs.sendMessage');
    return Promise.resolve(undefined);
  });
  emitToOriginMock.mockResolvedValue(1);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('markRequestResponded', () => {
  it('snapshots the windowIds and marks the request responded', () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );

    expect(markRequestResponded(store, 'r1')).toEqual({
      windowIds: [10, 11],
      isLedgerFlow: true,
      permissionWindowId: 11
    });
    expect(store.getState().windowManagement.requests.r1).toEqual({
      status: 'responded'
    });
  });

  it('isLedgerFlow is false when the slot names a window this request does not display', () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 99, openerWindowId: null })
    );

    expect(markRequestResponded(store, 'r1')).toEqual({
      windowIds: [10],
      isLedgerFlow: false,
      permissionWindowId: 99
    });
  });

  it('an inherited descriptor is not a request — kills a bare requests[requestId] read', () => {
    // A map with only own keys does NOT discriminate: Object.prototype.hasOwnProperty.status
    // is undefined, which lands in the same else-branch as the safe read.
    const dispatch = jest.fn();
    const store = {
      dispatch,
      getState: () => ({
        ledger: { windowId: 11 },
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: Object.create({
            polluted: {
              status: 'open',
              tabId: 7,
              origin: 'https://dapp.example',
              method: 'sign',
              windowIds: [10, 11]
            }
          })
        }
      })
    } as unknown as MainStore;

    expect(markRequestResponded(store, 'polluted')).toEqual(NOTHING_DISPLAYS);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('a tombstone snapshots nothing and dispatches nothing', () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );

    markRequestResponded(store, 'r1');
    order = [];

    expect(markRequestResponded(store, 'r1')).toEqual(NOTHING_DISPLAYS);
    expect(
      order.includes('dispatch:windowManagement/windowRequestResponded')
    ).toBe(false);
  });
});

describe('closeLedgerWindowsAfterResponse', () => {
  it('clears the ledger slice BEFORE the first removal, and one failed removal does not skip the others', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    const displays = markRequestResponded(store, 'r1');
    order = [];

    removeMock.mockImplementation((id: number) => {
      order.push(`windows.remove:${id}`);
      return id === 10 ? Promise.reject(new Error('boom')) : Promise.resolve();
    });

    await closeLedgerWindowsAfterResponse(store, displays);

    const clearedIndex = order.indexOf('dispatch:ledger/ledgerStateCleared');
    const removeIndex = order.findIndex(e => e.startsWith('windows.remove:'));
    expect(clearedIndex).toBeGreaterThanOrEqual(0);
    expect(removeIndex).toBeGreaterThanOrEqual(0);
    expect(clearedIndex).toBeLessThan(removeIndex);
    expect(store.getState().ledger.windowId).toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'close-on-response: window removal failed',
      { windowId: 10 },
      expect.any(Error)
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('deadbeef');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      'dapp.example'
    );
  });

  it('everything was taken over: nothing is removed and the slice is not cleared', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    const displays = markRequestResponded(store, 'r1');
    openWith(store, 'r2', [10]);
    openWith(store, 'r3', [11]);
    order = [];

    await closeLedgerWindowsAfterResponse(store, displays);

    expect(removeMock).not.toHaveBeenCalled();
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(false);
  });

  it('only the permission window was taken over: removes 10 only and leaves the slot alone', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    const displays = markRequestResponded(store, 'r1');
    openWith(store, 'r2', [11]);
    order = [];

    await closeLedgerWindowsAfterResponse(store, displays);

    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith(10);
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(false);
    expect(store.getState().ledger.windowId).toBe(11);
  });

  it('does not clear the slice when another flow already claimed ledger.windowId', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    const displays = markRequestResponded(store, 'r1');
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 99, openerWindowId: null })
    );
    order = [];

    await closeLedgerWindowsAfterResponse(store, displays);

    expect(removeMock).toHaveBeenCalledWith(11);
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(false);
    expect(store.getState().ledger.windowId).toBe(99);
  });

  it('a non-Ledger snapshot closes nothing', async () => {
    const store = makeRealStore();

    await closeLedgerWindowsAfterResponse(store, NOTHING_DISPLAYS);

    expect(removeMock).not.toHaveBeenCalled();
  });

  it('a throwing dispatch is swallowed, not rejected', async () => {
    const store = {
      getState: () => ({
        ledger: { windowId: 11 },
        windowManagement: {
          windowId: null,
          exportKeysWindowId: null,
          requests: {}
        }
      }),
      dispatch: jest.fn(() => {
        throw new Error('boom');
      })
    } as unknown as MainStore;

    await expect(
      closeLedgerWindowsAfterResponse(store, {
        windowIds: [10, 11],
        isLedgerFlow: true,
        permissionWindowId: 11
      })
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'close-on-response: failed',
      expect.any(Error)
    );
    expect(removeMock).not.toHaveBeenCalled();
  });
});

describe('handleSdkResponseToTab (WALLET-1416 wiring)', () => {
  it('closes both the approval and the permission window on a successful Ledger sign', async () => {
    // Kills a close that returns early, and one that computes displays but never
    // dispatches windowRequestResponded.
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
  });

  it('removes the windows only AFTER the response has been delivered', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(order).toContain('tabs.sendMessage');
    expect(order).toContain('windows.remove:10');
    expect(order.indexOf('tabs.sendMessage')).toBeLessThan(
      order.indexOf('windows.remove:10')
    );
  });

  it('a non-Ledger request closes nothing but is still marked responded', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10]);
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(sendMessageMock).toHaveBeenCalled();
    expect(store.getState().windowManagement.requests.r1).toEqual({
      status: 'responded'
    });
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("a foreign flow's permission window is neither closed nor cleared", async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 99, openerWindowId: null })
    );
    store.dispatch(ledgerDeployChanged('deploy-json'));
    store.dispatch(ledgerTransactionChanged('transaction-json'));
    store.dispatch(ledgerRecipientToSaveOnSuccessChanged('recipient'));
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock).not.toHaveBeenCalled();
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(false);
  });

  it('subtracts a window a second request claimed during delivery', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    sendMessageMock.mockImplementation(() => {
      order.push('tabs.sendMessage');
      openWith(store, 'r2', [10]);
      return Promise.resolve(undefined);
    });

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith(11);
  });

  it('closes exactly once for two identical responses', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();
    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock).toHaveBeenCalledTimes(2);
  });

  it('a deduped response closes nothing', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    store.dispatch(windowRequestResponded({ requestId: 'r1' }));
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('after an MV3 restart it delivers and closes nothing', async () => {
    const store = makeRealStore();
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    store.dispatch(windowIdChanged(10));
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(sendMessageMock).toHaveBeenCalled();
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('the same-origin fallback that delivered nothing does not mark responded', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    emitToOriginMock.mockResolvedValue(0);
    order = [];

    await handleSdkResponseToTab(
      makeMessage('r1', -1),
      UI_SENDER_WITH_ORIGIN,
      store
    );
    await flushMicrotasks();

    expect(store.getState().windowManagement.requests.r1).toMatchObject({
      status: 'open'
    });
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('the same-origin fallback that DID deliver closes the flow', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    emitToOriginMock.mockResolvedValue(1);
    order = [];

    await handleSdkResponseToTab(
      makeMessage('r1', -1),
      UI_SENDER_WITH_ORIGIN,
      store
    );
    await flushMicrotasks();

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
  });

  it('never enumerates the browser', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
    expect(windows.getAll).not.toHaveBeenCalled();
    expect(windows.get).not.toHaveBeenCalled();
  });

  it('never detaches what it removes', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
    expect(
      order.includes('dispatch:windowManagement/windowDetachedFromRequests')
    ).toBe(false);
  });

  it('does not clear a slot another flow claimed during delivery', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    sendMessageMock.mockImplementation(() => {
      order.push('tabs.sendMessage');
      store.dispatch(
        ledgerNewWindowIdChanged({ windowId: 77, openerWindowId: null })
      );
      return Promise.resolve(undefined);
    });

    await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
    await flushMicrotasks();

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(false);
  });

  it('the handler resolves even when a removal never settles', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    removeMock.mockImplementation((id: number) => {
      order.push(`windows.remove:${id}`);
      return new Promise(() => {});
    });

    const result = await handleSdkResponseToTab(
      makeMessage('r1'),
      UI_SENDER,
      store
    );
    await flushMicrotasks();

    expect(result).toEqual({ handled: true, response: undefined });
    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
  });

  it("a terminal signError closes the Ledger flow's windows", async () => {
    // The permission window is `type: 'normal'`, so its own Close button
    // cannot remove it.
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );
    order = [];

    await handleSdkResponseToTab(
      {
        type: SDK_RESPONSE_TO_TAB,
        action: sdkMethod.signError(new Error('x'), { requestId: 'r1' }),
        tabId: 7
      },
      UI_SENDER,
      store
    );
    await flushMicrotasks();

    expect(sendMessageMock).toHaveBeenCalled();
    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);
    expect(order.includes('dispatch:ledger/ledgerStateCleared')).toBe(true);
  });

  it('a cancel response closes both windows and never double-cancels', async () => {
    jest.useFakeTimers();
    try {
      const store = makeRealStore();
      openWith(store, 'r1', [10, 11]);
      store.dispatch(
        ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
      );

      await handleSdkResponseToTab(
        {
          type: SDK_RESPONSE_TO_TAB,
          action: sdkMethod.signResponse(
            { cancelled: true },
            { requestId: 'r1' }
          ),
          tabId: 7
        },
        UI_SENDER,
        store
      );
      await jest.advanceTimersByTimeAsync(0);

      expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 11]);

      await handleWindowRemoved(store, 10);
      await handleWindowRemoved(store, 11);
      await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);

      // Exactly one delivery: the user's own cancel. The two window removals
      // above must not synthesise a second cancel for the same request.
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('a cancel that races its own window self-close still closes the permission window', async () => {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 11]);
    store.dispatch(
      ledgerNewWindowIdChanged({ windowId: 11, openerWindowId: null })
    );

    await cancelRequestsDisplacedBy(store, 10, 'cancel-on-close');

    expect(store.getState().windowManagement.requests.r1).toMatchObject({
      windowIds: [11]
    });

    await handleSdkResponseToTab(
      {
        type: SDK_RESPONSE_TO_TAB,
        action: sdkMethod.signResponse(
          { cancelled: true },
          { requestId: 'r1' }
        ),
        tabId: 7
      },
      UI_SENDER,
      store
    );
    await flushMicrotasks();

    expect(removeMock).toHaveBeenCalledWith(11);
  });

  it('answering then closing does not self-cancel', async () => {
    // Single window, so it is genuinely a cancel candidate when it closes
    // (cancelRequestsDisplacedBy only builds candidates when
    // windowIds.length === 1, cancel-requests.ts:177-179) — the mark made by
    // handleSdkResponseToTab is the ONLY thing stopping the cancel.
    jest.useFakeTimers();
    try {
      const store = makeRealStore();
      openWith(store, 'r1', [10]);
      store.dispatch(windowIdChanged(10));

      await handleSdkResponseToTab(makeMessage('r1'), UI_SENDER, store);
      await jest.advanceTimersByTimeAsync(0);

      // Not awaited yet: a real (unanswered) request here would be a genuine
      // candidate and would sit behind CANCEL_GRACE_MS's setTimeout, which
      // never fires under fake timers unless the clock is advanced first.
      const removalPromise = handleWindowRemoved(store, 10);
      await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
      await removalPromise;

      // Exactly the one real answer — no synthesised cancel from the window
      // closing afterwards.
      expect(sendMessageMock).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).not.toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          payload: expect.objectContaining({ cancelled: true })
        })
      );
      expect(order.includes('dispatch:windowManagement/windowIdCleared')).toBe(
        true
      );
    } finally {
      jest.useRealTimers();
    }
  });
});
