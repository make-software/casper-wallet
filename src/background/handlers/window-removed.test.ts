import { MainStore } from '@background/redux/get-main-store';
import { exportKeysWindowIdCleared } from '@background/redux/windowManagement/actions';

import { cancelOpenRequestsForClosedWindow } from './cancel-open-requests-on-close';
import { handleWindowRemoved } from './window-removed';

jest.mock('./cancel-open-requests-on-close', () => ({
  cancelOpenRequestsForClosedWindow: jest.fn().mockResolvedValue(undefined)
}));

const cancelMock = cancelOpenRequestsForClosedWindow as jest.Mock;

const makeStore = (exportKeysWindowId: number | null) => {
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getState: () => ({
      windowManagement: { windowId: null, exportKeysWindowId, requests: {} }
    })
  } as unknown as MainStore;
  return { store, dispatch };
};

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  cancelMock.mockResolvedValue(undefined);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

it('runs the close-path cancellation for the removed window', async () => {
  const { store } = makeStore(null);

  await handleWindowRemoved(store, 7);

  expect(cancelMock).toHaveBeenCalledWith(store, 7);
});

it('clears the tracked export-keys id when that window is the one removed', async () => {
  const { store, dispatch } = makeStore(7);

  await handleWindowRemoved(store, 7);

  expect(dispatch).toHaveBeenCalledWith(exportKeysWindowIdCleared());
});

it('leaves the export-keys id alone for an unrelated window', async () => {
  const { store, dispatch } = makeStore(7);

  await handleWindowRemoved(store, 8);

  expect(dispatch).not.toHaveBeenCalled();
});

it('still clears the export-keys id when the cancellation throws', async () => {
  // The cancel and the export-keys cleanup are independent. Sharing one
  // try/catch — or none — means a failure in the first silently skips the
  // second, leaving a tracked id whose window is gone: the next export-keys
  // open then focuses a dead window.
  cancelMock.mockRejectedValue(new Error('cancel blew up'));
  const { store, dispatch } = makeStore(7);

  await handleWindowRemoved(store, 7);

  expect(consoleError).toHaveBeenCalledWith(
    'cancel-on-close: failed to cancel open requests',
    expect.any(Error)
  );
  expect(dispatch).toHaveBeenCalledWith(exportKeysWindowIdCleared());
});

it('never rejects, so the listener cannot produce an unhandled rejection', async () => {
  cancelMock.mockRejectedValue(new Error('cancel blew up'));
  const dispatch = jest.fn(() => {
    throw new Error('dispatch blew up');
  });
  const store = {
    dispatch,
    getState: () => ({
      windowManagement: { windowId: null, exportKeysWindowId: 7, requests: {} }
    })
  } as unknown as MainStore;

  await expect(handleWindowRemoved(store, 7)).resolves.toBeUndefined();
});
