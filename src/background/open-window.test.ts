import { windows } from 'webextension-polyfill';

import { WindowApp, createOpenWindow } from '@background/create-open-window';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdChanged,
  windowIdCleared,
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';

import {
  cancelRequestsDisplacedBy,
  failRequestOnWindowError
} from './handlers/cancel-requests';
import { openWindow } from './open-window';

// `create-open-window` imports `webextension-polyfill`, which throws outside a
// browser extension. Stub it so the module can load under `requireActual`.
jest.mock('webextension-polyfill', () => ({
  windows: {
    getAll: jest.fn(),
    get: jest.fn(),
    getCurrent: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  tabs: { update: jest.fn() }
}));

// Mock the window-creation factory so the test exercises ONLY the store-routing
// wiring in `openWindow`, not the real `windows.create` browser call.
jest.mock('@background/create-open-window', () => {
  const actual = jest.requireActual('@background/create-open-window');
  return {
    ...actual,
    createOpenWindow: jest.fn()
  };
});

jest.mock('./handlers/cancel-requests', () => ({
  cancelRequestsDisplacedBy: jest.fn().mockResolvedValue(undefined),
  failRequestOnWindowError: jest.fn().mockResolvedValue(undefined)
}));

const createOpenWindowMock = createOpenWindow as jest.MockedFunction<
  typeof createOpenWindow
>;

const flush = () => new Promise(resolve => setImmediate(resolve));

function makeStore(windowId: number | null) {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({ windowManagement: { windowId, requests: {} } }),
    dispatch
  } as unknown as MainStore;
  return { store, dispatch };
}

describe('openWindow (background store routing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createOpenWindowMock.mockReset();
    // Return an inner opener so `openWindow` can invoke it fire-and-forget.
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: 1 }, reused: false })
    );
    // The post-attach liveness check calls `windows.get`; default it to
    // "still alive" so tests unrelated to that check don't trip it. When it
    // rejects, the probe confirms against the window list rather than trusting
    // the rejection's wording — default that list to empty, i.e. "really gone".
    (windows.get as jest.Mock).mockResolvedValue({ id: 1 });
    (windows.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('passes the slice windowId from store.getState() into createOpenWindow', () => {
    const { store } = makeStore(42);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r0' });

    expect(createOpenWindowMock).toHaveBeenCalledTimes(1);
    const config = createOpenWindowMock.mock.calls[0][0]!;
    expect(config.windowId).toBe(42);
  });

  it('passes null windowId when the slice has no tracked window', () => {
    const { store } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r0' });

    const config = createOpenWindowMock.mock.calls[0][0]!;
    expect(config.windowId).toBeNull();
  });

  it('invokes the returned opener with the forwarded props, excluding requestId', () => {
    const innerOpen = jest
      .fn()
      .mockResolvedValue({ window: { id: 1 }, reused: false });
    createOpenWindowMock.mockReturnValue(innerOpen);
    const { store } = makeStore(1);

    const props = {
      windowApp: WindowApp.SignatureRequestDeploy,
      searchParams: { requestId: 'r1' },
      requestId: 'r1'
    };
    openWindow(store, props);

    expect(innerOpen).toHaveBeenCalledWith({
      windowApp: WindowApp.SignatureRequestDeploy,
      searchParams: { requestId: 'r1' }
    });
  });

  it('setWindowId dispatches windowIdChanged with the new id', () => {
    const { store, dispatch } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r0' });

    const config = createOpenWindowMock.mock.calls[0][0]!;
    config.setWindowId!(7);
    expect(dispatch).toHaveBeenCalledWith(windowIdChanged(7));
  });

  it('clearWindowId dispatches windowIdCleared', () => {
    const { store, dispatch } = makeStore(5);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r0' });

    const config = createOpenWindowMock.mock.calls[0][0]!;
    config.clearWindowId!();
    expect(dispatch).toHaveBeenCalledWith(windowIdCleared());
  });

  it('attaches the opened window to the request', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: 21 }, reused: false })
    );
    const { store, dispatch } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r1' });
    await flush();

    expect(dispatch).toHaveBeenCalledWith(
      windowRequestWindowAttached({ requestId: 'r1', windowId: 21 })
    );
    expect(cancelRequestsDisplacedBy).not.toHaveBeenCalled();
  });

  it('cancels the displaced requests when the window was reused', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: 7 }, reused: true })
    );
    const { store } = makeStore(7);

    openWindow(store, {
      windowApp: WindowApp.SignatureRequestDeploy,
      requestId: 'r2'
    });
    await flush();

    expect(cancelRequestsDisplacedBy).toHaveBeenCalledWith(
      store,
      7,
      'cancel-on-supersede'
    );
  });

  it('cancels the incoming request when the window fails to open', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockRejectedValue(new Error('no window'))
    );
    const { store } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r3' });
    await flush();

    expect(failRequestOnWindowError).toHaveBeenCalledWith(store, 'r3');
  });

  it('cancels the incoming request when the resolved window has no id', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: undefined }, reused: false })
    );
    const { store, dispatch } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r4' });
    await flush();

    expect(failRequestOnWindowError).toHaveBeenCalledWith(store, 'r4');
    // Neither of the "there IS a window" outcomes should fire.
    expect(cancelRequestsDisplacedBy).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('windowRequestWindowAttached')
      })
    );
  });

  it('runs cancel-on-close when the attached window is already gone by the time the attach dispatches', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: 55 }, reused: false })
    );
    // Simulates window 55 having closed in the gap between `createOpenWindow`
    // resolving and this liveness check running: `windows.get` rejects the
    // way it does for a window id that no longer exists.
    (windows.get as jest.Mock).mockRejectedValue(new Error('no such window'));
    const { store, dispatch } = makeStore(null);

    openWindow(store, {
      windowApp: WindowApp.SignatureRequestDeploy,
      requestId: 'r5'
    });
    await flush();
    await flush();

    // The attach still happens (it raced, it wasn't wrong at the time)...
    expect(dispatch).toHaveBeenCalledWith(
      windowRequestWindowAttached({ requestId: 'r5', windowId: 55 })
    );
    // ...but since the window turned out to be gone, the same cancellation
    // `windows.onRemoved` would have run must run here instead, or request r5
    // would stay 'open' forever.
    expect(cancelRequestsDisplacedBy).toHaveBeenCalledWith(
      store,
      55,
      'cancel-on-close'
    );
  });

  it('logs a throw from the post-open handling instead of leaving it unhandled', async () => {
    // The two-arm `.then(onFulfilled, onRejected)` form is deliberate — the
    // recovery must not catch itself — but it leaves the success arm covered by
    // nothing. If `attachWindowToRequest` throws, the window is open and never
    // attached: `windowIds` stays `[]`, which the `length === 1` candidate
    // filter can never select, so no window event will ever cancel the request
    // and the dapp hangs for its full timeout with nothing logged.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { store, dispatch } = makeStore(null);
    (dispatch as jest.Mock).mockImplementation((action: { type: string }) => {
      if (action.type === windowRequestWindowAttached.type) {
        throw new Error('attach blew up');
      }
    });

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r7' });
    await flush();
    await flush();

    expect(consoleError).toHaveBeenCalledWith(
      'openWindow: post-open handling failed',
      expect.any(Error)
    );
    consoleError.mockRestore();
  });

  it('does NOT run cancel-on-close when the attached window is still alive', async () => {
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue({ window: { id: 21 }, reused: false })
    );
    (windows.get as jest.Mock).mockResolvedValue({ id: 21 });
    const { store } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp, requestId: 'r6' });
    await flush();
    await flush();

    expect(cancelRequestsDisplacedBy).not.toHaveBeenCalled();
  });
});
