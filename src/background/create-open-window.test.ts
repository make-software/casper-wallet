import { tabs, windows } from 'webextension-polyfill';

import { WindowApp, createOpenWindow } from './create-open-window';

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

const setWindowId = jest.fn();
const clearWindowId = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (windows.getCurrent as jest.Mock).mockResolvedValue({
    width: 1000,
    left: 0,
    top: 0,
    state: 'normal'
  });
  (windows.create as jest.Mock).mockResolvedValue({ id: 21 });
  (windows.update as jest.Mock).mockResolvedValue(undefined);
});

it('reports reused:true and navigates the RESOLVED tab', async () => {
  (windows.getAll as jest.Mock).mockResolvedValue([{ id: 7 }]);
  (windows.get as jest.Mock).mockResolvedValue({ id: 7, tabs: [{ id: 55 }] });

  const result = await createOpenWindow({
    windowId: 7,
    setWindowId,
    clearWindowId
  })({ windowApp: WindowApp.ConnectToApp });

  expect(result).toEqual({
    window: { id: 7, tabs: [{ id: 55 }] },
    reused: true
  });
  expect(tabs.update).toHaveBeenCalledWith(55, {
    url: 'connect-to-app.html'
  });
});

it('reports reused:false and tracks the new window', async () => {
  (windows.getAll as jest.Mock).mockResolvedValue([]);

  const result = await createOpenWindow({
    windowId: null,
    setWindowId,
    clearWindowId
  })({ windowApp: WindowApp.ConnectToApp });

  expect(result).toEqual({ window: { id: 21 }, reused: false });
  expect(setWindowId).toHaveBeenCalledWith(21);
});

it('does NOT retarget the tracked window id for an isNewWindow open', async () => {
  const result = await createOpenWindow({
    windowId: 7,
    setWindowId,
    clearWindowId
  })({ windowApp: WindowApp.ImportAccount, isNewWindow: true });

  expect(result.reused).toBe(false);
  expect(setWindowId).not.toHaveBeenCalled();
});
