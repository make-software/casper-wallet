import { WindowApp, createOpenWindow } from '@background/create-open-window';
import { MainStore } from '@background/redux/get-main-store';
import {
  windowIdChanged,
  windowIdCleared
} from '@background/redux/windowManagement/actions';

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

const createOpenWindowMock = createOpenWindow as jest.MockedFunction<
  typeof createOpenWindow
>;

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
    createOpenWindowMock.mockReset();
    // Return an inner opener so `openWindow` can invoke it fire-and-forget.
    createOpenWindowMock.mockReturnValue(
      jest.fn().mockResolvedValue(undefined)
    );
  });

  it('passes the slice windowId from store.getState() into createOpenWindow', () => {
    const { store } = makeStore(42);

    openWindow(store, { windowApp: WindowApp.ConnectToApp });

    expect(createOpenWindowMock).toHaveBeenCalledTimes(1);
    const config = createOpenWindowMock.mock.calls[0][0];
    expect(config.windowId).toBe(42);
  });

  it('passes null windowId when the slice has no tracked window', () => {
    const { store } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp });

    const config = createOpenWindowMock.mock.calls[0][0];
    expect(config.windowId).toBeNull();
  });

  it('invokes the returned opener with the forwarded props', () => {
    const innerOpen = jest.fn().mockResolvedValue(undefined);
    createOpenWindowMock.mockReturnValue(innerOpen);
    const { store } = makeStore(1);

    const props = {
      windowApp: WindowApp.SignatureRequestDeploy,
      searchParams: { requestId: 'r1' }
    };
    openWindow(store, props);

    expect(innerOpen).toHaveBeenCalledWith(props);
  });

  it('setWindowId dispatches windowIdChanged with the new id', () => {
    const { store, dispatch } = makeStore(null);

    openWindow(store, { windowApp: WindowApp.ConnectToApp });

    const config = createOpenWindowMock.mock.calls[0][0];
    config.setWindowId(7);
    expect(dispatch).toHaveBeenCalledWith(windowIdChanged(7));
  });

  it('clearWindowId dispatches windowIdCleared', () => {
    const { store, dispatch } = makeStore(5);

    openWindow(store, { windowApp: WindowApp.ConnectToApp });

    const config = createOpenWindowMock.mock.calls[0][0];
    config.clearWindowId();
    expect(dispatch).toHaveBeenCalledWith(windowIdCleared());
  });
});
