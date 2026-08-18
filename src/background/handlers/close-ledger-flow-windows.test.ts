import { windows } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { Request } from '@background/redux/windowManagement/types';

import { handleCloseLedgerFlowWindows } from './close-ledger-flow-windows';

jest.mock('webextension-polyfill', () => ({
  windows: { remove: jest.fn().mockResolvedValue(undefined) }
}));

const removeMock = windows.remove as jest.Mock;

const makeStore = (
  ledgerWindowId: number | null,
  requests: Partial<Record<string, Request>> = {}
) => {
  const dispatch = jest.fn();
  const store = {
    dispatch,
    getState: () => ({
      ledger: { windowId: ledgerWindowId },
      windowManagement: { windowId: null, exportKeysWindowId: null, requests }
    })
  } as unknown as MainStore;
  return { store, dispatch };
};

const openRequest = (windowIds: number[]): Request => ({
  status: 'open',
  tabId: 1,
  origin: 'https://dapp.example',
  method: 'sign',
  windowIds,
  awaitingDeviceConfirmation: false
});

const removedIds = () => removeMock.mock.calls.map(([id]) => id).sort();

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  removeMock.mockResolvedValue(undefined);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

it("closes the caller's permission window and every window still displaying the request", async () => {
  const { store } = makeStore(20, { r1: openRequest([10, 20]) });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(removedIds()).toEqual([10, 20]);
});

it('closes each window exactly once when the sets overlap', async () => {
  // `windowIds` contains the permission window too (use-ledger attaches it via
  // windowRequestWindowAttached), so a naive concat would call remove twice and
  // the second call would reject with "No window with id".
  const { store } = makeStore(20, { r1: openRequest([10, 20]) });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(removeMock).toHaveBeenCalledTimes(2);
});

it('closes nothing outside the flow — an unrelated request keeps its window', async () => {
  // This is the whole ticket: the predecessor closed every popup in the profile,
  // which cancelled other dapps' approvals and the secret-key export window.
  const { store } = makeStore(20, {
    r1: openRequest([10, 20]),
    other: openRequest([99])
  });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(removeMock).not.toHaveBeenCalledWith(99);
});

it('leaves a window a second open request still claims, even when this flow lists it', async () => {
  // The shared approval window: a second dapp request reuses it, so it is that
  // request's only display and removing it here answers a dapp we were not asked
  // about. Same subtraction the response path does.
  const { store } = makeStore(20, {
    r1: openRequest([10, 20]),
    other: openRequest([10])
  });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(removedIds()).toEqual([20]);
});

it("closes only the caller's permission window for an internal flow with no requestId", async () => {
  const { store } = makeStore(20, { other: openRequest([99]) });

  await handleCloseLedgerFlowWindows(store, { permissionWindowId: 20 });

  expect(removedIds()).toEqual([20]);
});

it('closes only the permission window when the response path already collapsed the descriptor', async () => {
  // After close-windows-on-response.ts runs, the descriptor is already
  // { status: 'responded' } (dropping windowIds); this is the normal residue.
  const { store } = makeStore(20, { r1: { status: 'responded' } });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(removedIds()).toEqual([20]);
  expect(consoleWarn).toHaveBeenCalledWith(
    'closeLedgerFlowWindows: no open descriptor for the request; closing the permission window only',
    { requestId: 'r1' }
  );
});

it('reads the requests map by own properties only', async () => {
  // requestId is dapp-controlled (generateRequestId, src/content/sdk.ts). The
  // console.warn assertion is what proves the safe read fell into the
  // no-descriptor branch rather than reaching the inherited one.
  const { store } = makeStore(
    20,
    Object.create({ polluted: openRequest([10, 20]) })
  );

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'polluted',
    permissionWindowId: 20
  });

  expect(removedIds()).toEqual([20]);
  expect(consoleWarn).toHaveBeenCalledWith(
    'closeLedgerFlowWindows: no open descriptor for the request; closing the permission window only',
    { requestId: 'polluted' }
  );
});

it('clears the ledger slice even when every removal fails', async () => {
  removeMock.mockRejectedValue(new Error('No window with id'));
  const { store, dispatch } = makeStore(20, { r1: openRequest([10, 20]) });

  await handleCloseLedgerFlowWindows(store, {
    requestId: 'r1',
    permissionWindowId: 20
  });

  expect(dispatch).toHaveBeenCalledWith(ledgerStateCleared());
});

it('never rejects, and one failed removal does not skip the others', async () => {
  removeMock.mockImplementation((id: number) =>
    id === 10 ? Promise.reject(new Error('gone')) : Promise.resolve()
  );
  const { store } = makeStore(20, { r1: openRequest([10, 20]) });

  await expect(
    handleCloseLedgerFlowWindows(store, {
      requestId: 'r1',
      permissionWindowId: 20
    })
  ).resolves.toBeUndefined();
  expect(removeMock).toHaveBeenCalledWith(20);
  expect(consoleError).toHaveBeenCalledWith(
    'closeLedgerFlowWindows: window removal failed',
    { windowId: 10 },
    expect.any(Error)
  );
});

it("closes the caller's window but leaves the slice when the slot already moved on", async () => {
  const { store, dispatch } = makeStore(null);

  await handleCloseLedgerFlowWindows(store, { permissionWindowId: 20 });

  expect(removedIds()).toEqual([20]);
  expect(dispatch).not.toHaveBeenCalled();
});

describe('a second flow holding the global slot', () => {
  // `state.ledger.windowId` is one scalar with no per-request keying, and it can
  // be released while its window is still open (LedgerDisconnectedFooter's
  // Connect CTA dispatches ledgerStateCleared). Reading it here removed the
  // taking-over flow's window mid device-confirmation.
  it("never removes the slot's window on the caller's behalf", async () => {
    const { store } = makeStore(77, { r1: openRequest([10]) });

    await handleCloseLedgerFlowWindows(store, {
      requestId: 'r1',
      permissionWindowId: 20
    });

    expect(removeMock).not.toHaveBeenCalledWith(77);
    expect(removedIds()).toEqual([10, 20]);
  });

  it('does not clear the slice, so the other flow keeps the deploy it is signing', async () => {
    const { store, dispatch } = makeStore(77);

    await handleCloseLedgerFlowWindows(store, { permissionWindowId: 20 });

    expect(removedIds()).toEqual([20]);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
