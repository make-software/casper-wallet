import { windows } from 'webextension-polyfill';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { createLedgerWindowCloseTracker } from './ledger-window-close-listener';

jest.mock('@background/redux/utils', () => ({
  dispatchToMainStore: jest.fn()
}));

// webextension-polyfill throws on import outside an extension context, and only
// these two members are reached from here.
jest.mock('webextension-polyfill', () => ({
  windows: { onRemoved: { addListener: jest.fn(), removeListener: jest.fn() } }
}));

const dispatchMock = dispatchToMainStore as jest.Mock;
const addListenerMock = windows.onRemoved.addListener as jest.Mock;
const removeListenerMock = windows.onRemoved.removeListener as jest.Mock;

const armedListener = (nth = 0) =>
  addListenerMock.mock.calls[nth][0] as (removedWindowId: number) => void;

beforeEach(() => {
  jest.clearAllMocks();
});

it('ignores a window that is not the tracked permission window', () => {
  const tracker = createLedgerWindowCloseTracker();
  tracker.arm(9);

  armedListener()(10);

  // ledgerStateCleared resets the whole slice, so a close anywhere else in the
  // browser must not reach the store — and must not consume the listener
  // either, or the real close clears nothing.
  expect(dispatchMock).not.toHaveBeenCalled();
  expect(removeListenerMock).not.toHaveBeenCalled();
});

it('clears the ledger state when the tracked window is removed', () => {
  const tracker = createLedgerWindowCloseTracker();
  tracker.arm(9);

  armedListener()(9);

  expect(dispatchMock).toHaveBeenCalledTimes(1);
  expect(dispatchMock).toHaveBeenCalledWith(ledgerStateCleared());
});

it('detaches itself once the tracked window has been removed', () => {
  const tracker = createLedgerWindowCloseTracker();
  tracker.arm(9);
  const listener = armedListener();

  listener(9);

  expect(removeListenerMock).toHaveBeenCalledTimes(1);
  // The same function object, or windows.onRemoved keeps a listener that
  // outlives the window it was registered for.
  expect(removeListenerMock).toHaveBeenCalledWith(listener);
});

it('detaches a listener whose window is never closed', () => {
  const tracker = createLedgerWindowCloseTracker();
  tracker.arm(9);
  const listener = armedListener();

  tracker.detach();

  // The id guard makes self-removal correct, not guaranteed: ledgerStateCleared
  // reaches the store from paths that never close this window, and a listener
  // left armed would later wipe whatever flow replaced this one.
  expect(removeListenerMock).toHaveBeenCalledWith(listener);

  // Already gone: a second detach must not re-remove, and nothing was
  // dispatched — detaching is not the same as the window having closed.
  tracker.detach();

  expect(removeListenerMock).toHaveBeenCalledTimes(1);
  expect(dispatchMock).not.toHaveBeenCalled();
});

it('drops the previous listener when armed again', () => {
  const tracker = createLedgerWindowCloseTracker();
  tracker.arm(9);
  const first = armedListener(0);

  tracker.arm(11);

  expect(removeListenerMock).toHaveBeenCalledWith(first);
  expect(addListenerMock).toHaveBeenCalledTimes(2);

  // Only the current window is watched; the abandoned one is inert.
  armedListener(1)(9);
  expect(dispatchMock).not.toHaveBeenCalled();

  armedListener(1)(11);
  expect(dispatchMock).toHaveBeenCalledTimes(1);
});
