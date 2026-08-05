import { windows } from 'webextension-polyfill';

import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { attachWindowToRequest } from './attach-window-to-request';
import { cancelRequestsDisplacedBy } from './cancel-requests';

jest.mock('webextension-polyfill', () => ({
  windows: { get: jest.fn(), getAll: jest.fn() },
  runtime: { getURL: (path: string) => `chrome-extension://ext-id/${path}` }
}));

const extensionTab = (search = '?requestId=r1') => ({
  url: `chrome-extension://ext-id/signature-request.html${search}`
});
jest.mock('./cancel-requests', () => ({
  cancelRequestsDisplacedBy: jest.fn().mockResolvedValue(undefined)
}));

const getMock = windows.get as jest.Mock;
const getAllMock = windows.getAll as jest.Mock;
const cancelMock = cancelRequestsDisplacedBy as jest.Mock;

// The liveness probe is fire-and-forget, so let the microtask queue drain.
const flush = () => new Promise(resolve => setImmediate(resolve));

const makeStore = () => {
  const dispatch = jest.fn();
  return { store: { dispatch } as any, dispatch };
};

beforeEach(() => {
  jest.clearAllMocks();
  getMock.mockResolvedValue({ id: 7 });
  getAllMock.mockResolvedValue([]);
  cancelMock.mockResolvedValue(undefined);
});

it('attaches the window and leaves a live one alone', async () => {
  getMock.mockResolvedValue({ id: 7, tabs: [extensionTab()] });
  const { store, dispatch } = makeStore();

  attachWindowToRequest(store, 'r1', 7);
  await flush();

  expect(dispatch).toHaveBeenCalledWith(
    windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
  );
  expect(getMock).toHaveBeenCalledWith(7, { populate: true });
  expect(cancelMock).not.toHaveBeenCalled();
});

describe('a window that is not ours must not own a request', () => {
  it('undoes the attach when the window shows a web page', async () => {
    // "A window with this id exists" is not the question — any live browser
    // window passes that. A foreign id sits in `windowIds` keeping the set
    // oversized, so closing the REAL approval window no longer cancels
    // anything and the request's fate hangs on an unrelated window.
    getMock.mockResolvedValue({
      id: 7,
      tabs: [{ url: 'https://dapp.example/page' }]
    });
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).toHaveBeenCalledWith(store, 7, 'cancel-on-close');
  });

  it('accepts a window whose tab is still loading, via pendingUrl', async () => {
    getMock.mockResolvedValue({
      id: 7,
      tabs: [{ pendingUrl: 'chrome-extension://ext-id/signature-request.html' }]
    });
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('does not undo the attach when no URL is known yet', async () => {
    // On the reuse path `tabs.update` resolves when the navigation STARTS, so
    // the tab can legitimately have no url yet. Repairing on that would cancel
    // a live approval — the exact failure this whole model prevents — so an
    // inconclusive probe leaves the attach standing.
    getMock.mockResolvedValue({ id: 7, tabs: [{}] });
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('warns but does not undo the attach when our window shows a different request', async () => {
    // Same reasoning: the URL may still be the previous request's during the
    // reuse round trip, so this is a diagnostic, not a verdict.
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    getMock.mockResolvedValue({
      id: 7,
      tabs: [extensionTab('?requestId=someone-else')]
    });
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith(
      'attachWindowToRequest: window shows a different requestId',
      { requestId: 'r1', windowId: 7 }
    );
    consoleWarn.mockRestore();
  });
});

it('repairs the request when the window is already gone', async () => {
  // The window closed during the round trip: `onRemoved` already ran while this
  // request had no window, found no candidates, and nothing else would ever
  // cancel it. Without this the dapp hangs until its own timeout.
  getMock.mockRejectedValue(new Error('No window with id: 7'));
  const { store, dispatch } = makeStore();

  attachWindowToRequest(store, 'r1', 7);
  await flush();

  expect(dispatch).toHaveBeenCalledWith(
    windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
  );
  expect(cancelMock).toHaveBeenCalledWith(store, 7, 'cancel-on-close');
});

it('repairs the same way for a windowId that never existed', async () => {
  // A UI page crosses a message boundary to get here, so the id is not trusted
  // to correspond to a real window. An id nothing can ever remove would keep
  // `windowIds` permanently oversized and the request permanently uncancellable.
  getMock.mockRejectedValue(new Error('No window with id: 999999'));
  const { store } = makeStore();

  attachWindowToRequest(store, 'r1', 999999);
  await flush();

  expect(cancelMock).toHaveBeenCalledWith(store, 999999, 'cancel-on-close');
});

it('does not swallow the repair failing', async () => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  getMock.mockRejectedValue(new Error('gone'));
  cancelMock.mockRejectedValue(new Error('repair blew up'));
  const { store } = makeStore();

  attachWindowToRequest(store, 'r1', 7);
  await flush();

  expect(consoleError).toHaveBeenCalledWith(
    'cancel-on-close: failed',
    expect.any(Error)
  );
  consoleError.mockRestore();
});

describe('an unexplained probe rejection must not cancel a live approval', () => {
  it('leaves the request alone when the window is still in the window list', async () => {
    // `windows.get` can reject for reasons that are NOT "no such window" — a
    // transient extension-context error, a WKWebExtension window-type quirk.
    // Treating those as "gone" cancels an approval the user is looking at and
    // tells the dapp it was cancelled. Confirm against the window list instead
    // of trusting the rejection, so this never depends on an error's wording.
    getMock.mockRejectedValue(new Error('Extension context invalidated'));
    getAllMock.mockResolvedValue([{ id: 4 }, { id: 7 }]);
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).not.toHaveBeenCalled();
  });

  it('logs the rejection with its identifiers so a hostile dispatcher is not indistinguishable from a race', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const error = new Error('No window with id: 7');
    getMock.mockRejectedValue(error);
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(consoleError).toHaveBeenCalledWith(
      'attachWindowToRequest: window liveness probe rejected',
      { requestId: 'r1', windowId: 7 },
      error
    );
    consoleError.mockRestore();
  });

  it('does not repair when the window list itself is unavailable', async () => {
    // Fail closed in the destructive direction: an uncancellable request hangs
    // the dapp until its own timeout, which is recoverable; a wrongly cancelled
    // one destroys a signature the user already approved.
    getMock.mockRejectedValue(new Error('boom'));
    getAllMock.mockRejectedValue(new Error('also boom'));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { store } = makeStore();

    attachWindowToRequest(store, 'r1', 7);
    await flush();

    expect(cancelMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('malformed payloads never reach the store', () => {
  it.each([
    ['a non-integer windowId', 'r1', 1.5],
    ['a NaN windowId', 'r1', Number.NaN],
    ['an empty requestId', '', 7],
    ['a non-string requestId', undefined as unknown as string, 7]
  ])('ignores %s', async (_label, requestId, windowId) => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { store, dispatch } = makeStore();

    attachWindowToRequest(store, requestId, windowId as number);
    await flush();

    expect(dispatch).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
    expect(cancelMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
