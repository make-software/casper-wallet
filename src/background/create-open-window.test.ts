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

// getUrlByWindowApp is the one hand-written branch table in this module: the
// hash routes and the `?`-vs-`&` joining for SwitchAccount are both easy to
// break and invisible until a window opens on the wrong screen.
describe('window URLs', () => {
  const urlFor = async (
    windowApp: WindowApp,
    searchParams?: Record<string, string>
  ) => {
    (windows.getAll as jest.Mock).mockResolvedValue([]);
    await createOpenWindow({ windowId: null, setWindowId, clearWindowId })({
      windowApp,
      searchParams
    });
    return (
      (windows.create as jest.Mock).mock.calls.at(-1)![0] as {
        url: string;
      }
    ).url;
  };

  it.each([
    [WindowApp.ImportAccount, 'import-account-with-file.html'],
    [WindowApp.ConnectToApp, 'connect-to-app.html'],
    [WindowApp.SignatureRequestDeploy, 'signature-request.html#'],
    [WindowApp.SignatureRequestMessage, 'signature-request.html#'],
    [WindowApp.SignatureRequestEip712, 'signature-request.html#'],
    [WindowApp.DecryptMessageRequest, 'signature-request.html#']
  ])('maps %s onto its own page', async (windowApp, prefix) => {
    expect(await urlFor(windowApp)).toContain(prefix);
  });

  it('gives each signature-request variant a distinct hash route', async () => {
    // Sequential, not Promise.all: urlFor reads mock.calls.at(-1), which
    // races across concurrently in-flight calls sharing the same mock.
    const routes = [
      await urlFor(WindowApp.SignatureRequestDeploy),
      await urlFor(WindowApp.SignatureRequestMessage),
      await urlFor(WindowApp.SignatureRequestEip712),
      await urlFor(WindowApp.DecryptMessageRequest)
    ];

    expect(new Set(routes).size).toBe(4);
  });

  it('appends search params with ? for a plain app', async () => {
    expect(await urlFor(WindowApp.ConnectToApp, { requestId: 'r1' })).toBe(
      'connect-to-app.html?requestId=r1'
    );
  });

  // SwitchAccount already carries a query string, so its params must join with
  // & — a `?` here silently drops every param after the first.
  it('joins search params with & for SwitchAccount', async () => {
    expect(await urlFor(WindowApp.SwitchAccount, { requestId: 'r1' })).toBe(
      'connect-to-app.html?switchAccount=true&requestId=r1'
    );
  });

  it('emits no trailing ? when there are no params', async () => {
    expect(await urlFor(WindowApp.ConnectToApp)).toBe('connect-to-app.html');
  });
});

describe('a tracked window that is already gone', () => {
  it('clears the tracked id and opens a fresh window', async () => {
    (windows.getAll as jest.Mock).mockResolvedValue([{ id: 999 }]);

    const result = await createOpenWindow({
      windowId: 7,
      setWindowId,
      clearWindowId
    })({ windowApp: WindowApp.ConnectToApp });

    expect(clearWindowId).toHaveBeenCalledTimes(1);
    expect(result.reused).toBe(false);
    expect(setWindowId).toHaveBeenCalledWith(21);
  });
});

describe('window geometry', () => {
  it('positions the popup against the right edge of the current window', async () => {
    (windows.getAll as jest.Mock).mockResolvedValue([]);

    await createOpenWindow({ windowId: null, setWindowId, clearWindowId })({
      windowApp: WindowApp.ConnectToApp
    });

    expect(windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'popup',
        height: 700,
        width: 376,
        left: 1000 - 376,
        top: 0,
        focused: true
      })
    );
  });

  // Firefox ignores width/height in fullscreen, so the code deliberately omits
  // them — and the e2e harness relies on the same branch via TEST_ENV.
  it('omits geometry in fullscreen', async () => {
    (windows.getAll as jest.Mock).mockResolvedValue([]);
    (windows.getCurrent as jest.Mock).mockResolvedValue({
      width: 1000,
      left: 0,
      top: 0,
      state: 'fullscreen'
    });

    await createOpenWindow({ windowId: null, setWindowId, clearWindowId })({
      windowApp: WindowApp.ConnectToApp
    });

    const config = (windows.create as jest.Mock).mock.calls.at(-1)![0];
    expect(config).not.toHaveProperty('width');
    expect(config).not.toHaveProperty('height');
  });
});
