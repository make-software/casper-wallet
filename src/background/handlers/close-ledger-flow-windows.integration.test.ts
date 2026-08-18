import { configureStore } from '@reduxjs/toolkit';
import { Runtime, tabs, windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { closeLedgerFlowWindows } from '@background/redux/ledger/actions';
import { reducer as ledger } from '@background/redux/ledger/reducer';
import {
  windowRequestOpened,
  windowRequestWindowAttached
} from '@background/redux/windowManagement/actions';
import { reducer as windowManagement } from '@background/redux/windowManagement/reducer';

import { CANCEL_GRACE_MS } from './cancel-requests';
import { handleReduxAction } from './redux-actions';
import { handleWindowRemoved } from './window-removed';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn().mockResolvedValue(undefined) },
  windows: { remove: jest.fn().mockResolvedValue(undefined), get: jest.fn() },
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

jest.mock('@background/open-onboarding-flow', () => ({
  enableOnboardingFlow: jest.fn()
}));

const removeMock = windows.remove as jest.Mock;
const sendMessageMock = tabs.sendMessage as jest.Mock;

// The approval window for `r1`, which is what dispatches the abandon.
const APPROVAL_WINDOW_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/signature-request.html?requestId=r1&origin=https://dapp.example&tabId=7#/sign-deploy'
} as Runtime.MessageSender;

function makeRealStore() {
  return configureStore({
    reducer: { ledger, windowManagement },
    middleware: getDefault =>
      getDefault({ immutableCheck: false, serializableCheck: false })
  }) as unknown as MainStore;
}

function openWith(store: MainStore, requestId: string, windowIds: number[]) {
  store.dispatch(
    windowRequestOpened({
      requestId,
      tabId: 7,
      origin: 'https://dapp.example',
      method: 'sign'
    })
  );
  windowIds.forEach(windowId =>
    store.dispatch(windowRequestWindowAttached({ requestId, windowId }))
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  removeMock.mockResolvedValue(undefined);
  sendMessageMock.mockResolvedValue(undefined);
});

// The unit suite mocks the polyfill down to `windows.remove` and never drives
// `handleWindowRemoved`, so it cannot see whether the dapp is ever answered — a
// change inside the handler that tombstoned the descriptor instead of leaving it
// open would build no cancel candidate and leave the promise pending forever.
it('the abandoned request is still answered once its windows are gone', async () => {
  jest.useFakeTimers();
  try {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 20]);

    await handleReduxAction(
      closeLedgerFlowWindows({ requestId: 'r1', permissionWindowId: 20 }),
      APPROVAL_WINDOW_SENDER,
      store
    );
    await jest.advanceTimersByTimeAsync(0);

    expect(removeMock.mock.calls.map(([id]) => id).sort()).toEqual([10, 20]);

    // What the browser does next, and the only thing that answers the dapp. Not
    // awaited before the clock moves: the last removal sleeps out the grace.
    const removed = Promise.all([
      handleWindowRemoved(store, 10),
      handleWindowRemoved(store, 20)
    ]);
    await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
    await removed;

    expect(sendMessageMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock.mock.calls[0][1]).toMatchObject({
      payload: { cancelled: true }
    });
  } finally {
    jest.useRealTimers();
  }
});

it("a second dapp's approval window survives the abandon and still answers on its own close", async () => {
  jest.useFakeTimers();
  try {
    const store = makeRealStore();
    openWith(store, 'r1', [10, 20]);
    // The shared approval window, reused by a second request.
    openWith(store, 'r2', [10]);

    await handleReduxAction(
      closeLedgerFlowWindows({ requestId: 'r1', permissionWindowId: 20 }),
      APPROVAL_WINDOW_SENDER,
      store
    );
    await jest.advanceTimersByTimeAsync(0);

    expect(removeMock.mock.calls.map(([id]) => id)).toEqual([20]);

    await handleWindowRemoved(store, 20);
    await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);

    expect(store.getState().windowManagement.requests.r2).toMatchObject({
      status: 'open',
      windowIds: [10]
    });
  } finally {
    jest.useRealTimers();
  }
});
