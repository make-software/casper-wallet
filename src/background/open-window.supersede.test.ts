import { configureStore } from '@reduxjs/toolkit';
import { tabs, windows } from 'webextension-polyfill';

import { WindowApp, createOpenWindow } from '@background/create-open-window';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowRequestOpened,
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';
import { reducer } from '@background/redux/windowManagement/reducer';

import { CANCEL_GRACE_MS } from './handlers/cancel-requests';
import { deliverViaOrigin } from './handlers/deliver-via-origin';
import { openWindow } from './open-window';

// This test wires the REAL windowManagement reducer and the REAL
// cancel-requests module (only the browser surface is mocked) so it exercises
// the actual invariant this task establishes: `openWindow` must dispatch the
// supersede-cancel for the DISPLACED request before it attaches the INCOMING
// one, so the incoming request can never appear in the cancel snapshot. A test
// that mocks `./handlers/cancel-requests` wholesale (as `open-window.test.ts`
// does, to test ONLY the store-routing wiring) cannot detect the two blocks
// being swapped — this file exists specifically to catch that.
jest.mock('webextension-polyfill', () => ({
  windows: {
    getAll: jest.fn(),
    get: jest.fn(),
    getCurrent: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  tabs: { update: jest.fn(), sendMessage: jest.fn() },
  runtime: { getManifest: jest.fn() }
}));

jest.mock('./handlers/deliver-via-origin', () => ({
  deliverViaOrigin: jest.fn()
}));

jest.mock('@background/create-open-window', () => {
  const actual = jest.requireActual('@background/create-open-window');
  return {
    ...actual,
    createOpenWindow: jest.fn()
  };
});

const createOpenWindowMock = createOpenWindow as jest.MockedFunction<
  typeof createOpenWindow
>;

function makeStore() {
  return configureStore({
    reducer: { windowManagement: reducer }
  }) as unknown as MainStore;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  createOpenWindowMock.mockReset();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
  // `openWindow`'s post-attach liveness check calls `windows.get`; default it
  // to "still alive" since this test is about the supersede/attach ordering,
  // not that check.
  (windows.get as jest.Mock).mockResolvedValue({ id: 7 });
});

afterEach(() => {
  jest.useRealTimers();
});

it('cancels the displaced request, not the incoming one, when a window is reused', async () => {
  const store = makeStore();

  // Request A is already open and attached to window 7 (the reused window).
  store.dispatch(
    windowRequestOpened({
      requestId: 'A',
      tabId: 3,
      origin: 'https://a',
      method: 'sign'
    })
  );
  store.dispatch(windowRequestWindowAttached({ requestId: 'A', windowId: 7 }));
  // Request B is the incoming one, registered but not yet attached to any window.
  store.dispatch(
    windowRequestOpened({
      requestId: 'B',
      tabId: 4,
      origin: 'https://b',
      method: 'sign'
    })
  );

  createOpenWindowMock.mockReturnValue(
    jest.fn().mockResolvedValue({ window: { id: 7 }, reused: true })
  );

  openWindow(store, {
    windowApp: WindowApp.SignatureRequestDeploy,
    requestId: 'B'
  });

  // Flush the `.then` microtask so `cancelRequestsDisplacedBy`'s synchronous
  // work (the candidate snapshot + `windowDetachedFromRequests` dispatch) runs
  // before the grace delay, then let the grace elapse and the cancel sends flush.
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await jest.advanceTimersByTimeAsync(0);

  const state = store.getState().windowManagement;
  expect(state.requests.A?.status).toBe('responded'); // displaced one cancelled
  expect(state.requests.B?.status).toBe('open'); // incoming one survives
  expect((state.requests.B as any).windowIds).toEqual([7]); // and is attached

  // The cancel was actually delivered to A's tab, not B's.
  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    expect.objectContaining({ type: expect.stringContaining('Sign:Response') })
  );
  expect(tabs.sendMessage).not.toHaveBeenCalledWith(4, expect.anything());
});
