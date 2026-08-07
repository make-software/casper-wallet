import { windows } from 'webextension-polyfill';

import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { makeLedgerWindowCloseListener } from './ledger-window-close-listener';

jest.mock('@background/redux/utils', () => ({
  dispatchToMainStore: jest.fn()
}));

// webextension-polyfill throws on import outside an extension context, and
// only onRemoved.removeListener is reached from here.
jest.mock('webextension-polyfill', () => ({
  windows: { onRemoved: { removeListener: jest.fn() } }
}));

const dispatchMock = dispatchToMainStore as jest.Mock;
const removeListenerMock = windows.onRemoved.removeListener as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

it('ignores a window that is not the tracked permission window', () => {
  const listener = makeLedgerWindowCloseListener(9);

  listener(10);

  // The whole ledger slice is what ledgerStateCleared resets, so a close
  // anywhere else in the browser must not reach the store — and must not
  // consume the listener either, or the real close clears nothing.
  expect(dispatchMock).not.toHaveBeenCalled();
  expect(removeListenerMock).not.toHaveBeenCalled();
});

it('clears the ledger state when the tracked window is removed', () => {
  const listener = makeLedgerWindowCloseListener(9);

  listener(9);

  expect(dispatchMock).toHaveBeenCalledTimes(1);
  expect(dispatchMock).toHaveBeenCalledWith(ledgerStateCleared());
});

it('detaches itself once the tracked window has been removed', () => {
  const listener = makeLedgerWindowCloseListener(9);

  listener(9);

  expect(removeListenerMock).toHaveBeenCalledTimes(1);
  // The same function object, or windows.onRemoved keeps a listener that
  // outlives the window it was registered for.
  expect(removeListenerMock).toHaveBeenCalledWith(listener);
});
