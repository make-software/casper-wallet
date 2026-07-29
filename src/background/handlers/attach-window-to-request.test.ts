import { windows } from 'webextension-polyfill';

import { windowRequestWindowAttached } from '@background/redux/windowManagement/actions';

import { attachWindowToRequest } from './attach-window-to-request';
import { cancelRequestsDisplacedBy } from './cancel-requests';

jest.mock('webextension-polyfill', () => ({
  windows: { get: jest.fn() }
}));
jest.mock('./cancel-requests', () => ({
  cancelRequestsDisplacedBy: jest.fn().mockResolvedValue(undefined)
}));

const getMock = windows.get as jest.Mock;
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
  cancelMock.mockResolvedValue(undefined);
});

it('attaches the window and leaves a live one alone', async () => {
  const { store, dispatch } = makeStore();

  attachWindowToRequest(store, 'r1', 7);
  await flush();

  expect(dispatch).toHaveBeenCalledWith(
    windowRequestWindowAttached({ requestId: 'r1', windowId: 7 })
  );
  expect(getMock).toHaveBeenCalledWith(7);
  expect(cancelMock).not.toHaveBeenCalled();
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
