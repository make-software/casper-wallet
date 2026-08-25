import { tabs } from 'webextension-polyfill';

import { collectRequestIdsFromOpenWindows } from '@background/open-request-windows';
import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { reducer } from '@background/redux/windowManagement/reducer';
import { MAX_SESSION_ROWS } from '@background/redux/windowManagement/session-store';
import {
  Request,
  WindowManagementState
} from '@background/redux/windowManagement/types';

import { sdkMethod } from '@content/sdk-method';

import { cancelOpenRequestsForClosedWindow } from './cancel-open-requests-on-close';
import { CANCEL_GRACE_MS } from './cancel-requests';
import { deliverViaOrigin } from './deliver-via-origin';
import { sweepOrphanedRequests } from './sweep-orphaned-requests';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn(), get: jest.fn() }
}));
jest.mock('./deliver-via-origin', () => ({ deliverViaOrigin: jest.fn() }));
jest.mock('@background/open-request-windows', () => ({
  collectRequestIdsFromOpenWindows: jest.fn()
}));

const openRow = (
  tabId: number,
  seq: number,
  windowIds: number[] = []
): Request => ({
  status: 'open',
  tabId,
  origin: 'https://dapp',
  method: 'sign',
  windowIds,
  awaitingDeviceConfirmation: false,
  seq
});

// A tiny real store: dispatch runs the REAL reducer, so the vehicle's own
// live re-check (the property this whole suite is about) is exercised
// against genuine transition guards, not a hand-rolled stand-in for them.
function makeStore(requests: WindowManagementState['requests']) {
  let windowManagement: WindowManagementState = {
    windowId: null,
    exportKeysWindowId: null,
    requests
  };
  const dispatch = jest.fn((action: any) => {
    windowManagement = reducer(windowManagement, action);
  });
  const getState = jest.fn(() => ({ windowManagement }));
  return { dispatch, getState } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  (tabs.get as jest.Mock).mockResolvedValue({ url: 'https://dapp/page' });
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('an empty hydrated map calls no getAll', async () => {
  const store = makeStore({});

  await sweepOrphanedRequests(store, {});

  expect(collectRequestIdsFromOpenWindows).not.toHaveBeenCalled();
});

it('ignores tombstoned and empty entries in the hydrated snapshot', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests: WindowManagementState['requests'] = {
    r1: { status: 'responded', seq: 0 },
    r2: undefined
  };
  const store = makeStore(requests);

  await sweepOrphanedRequests(store, requests);

  expect(collectRequestIdsFromOpenWindows).not.toHaveBeenCalled();
  expect(store.dispatch).not.toHaveBeenCalled();
});

it('a hydrated row no window claims is cancelled', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests = { r1: openRow(3, 0) };
  const store = makeStore(requests);

  const promise = sweepOrphanedRequests(store, requests);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
  expect(store.getState().windowManagement.requests.r1.status).toBe(
    'responded'
  );
});

it('a row a window still claims is untouched — including when its windowIds is empty', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(
    new Set(['r1'])
  );
  const requests = { r1: openRow(3, 0, []) };
  const store = makeStore(requests);

  await sweepOrphanedRequests(store, requests);

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(store.getState().windowManagement.requests.r1.status).toBe('open');
});

it('a Ledger row with two dead windows is cancelled', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests = { r1: openRow(3, 0, [7, 9]) };
  const store = makeStore(requests);

  const promise = sweepOrphanedRequests(store, requests);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  expect(tabs.sendMessage).toHaveBeenCalled();
  expect(store.getState().windowManagement.requests.r1.status).toBe(
    'responded'
  );
});

it('a row registered after init is untouched', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const hydrated = { r1: openRow(3, 0) };
  // r2 is live (present in the store) but was registered AFTER the hydrated
  // snapshot was taken, so it must never be considered.
  const store = makeStore({ ...hydrated, r2: openRow(4, 1) });

  const promise = sweepOrphanedRequests(store, hydrated);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  expect(tabs.sendMessage).not.toHaveBeenCalledWith(4, expect.anything());
  expect(store.getState().windowManagement.requests.r2.status).toBe('open');
});

it('a failed getAll cancels nothing', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(null);
  const requests = { r1: openRow(3, 0) };
  const store = makeStore(requests);

  await sweepOrphanedRequests(store, requests);

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(store.dispatch).not.toHaveBeenCalled();
});

it('a genuine response arriving during the grace wins and no cancel is sent', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const hydrated = { r1: openRow(3, 0) };
  const store = makeStore(hydrated);

  const promise = sweepOrphanedRequests(store, hydrated);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS - 1);
  // The genuine response landing mid-grace — e.g. a Ledger success arriving
  // via `sdk-response-to-tab`'s `markRequestResponded`.
  store.dispatch(windowRequestResponded({ requestId: 'r1' }));
  await jest.advanceTimersByTimeAsync(1);
  await promise;

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(store.getState().windowManagement.requests.r1.status).toBe(
    'responded'
  );
});

it('a navigated-away tab gets deliverViaOrigin, not a direct send', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  (tabs.get as jest.Mock).mockResolvedValue({ url: 'https://elsewhere/page' });
  const requests = { r1: openRow(3, 0) };
  const store = makeStore(requests);

  const promise = sweepOrphanedRequests(store, requests);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(deliverViaOrigin).toHaveBeenCalledWith(
    'https://dapp',
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
    undefined
  );
});

it('concurrent sweep + window-removed for the same row delivers exactly one cancel', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests = { r1: openRow(3, 0, [7]) };
  const store = makeStore(requests);

  const sweepPromise = sweepOrphanedRequests(store, requests);
  const removedPromise = cancelOpenRequestsForClosedWindow(store, 7);

  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await Promise.all([sweepPromise, removedPromise]);

  expect(tabs.sendMessage).toHaveBeenCalledTimes(1);
  expect(store.getState().windowManagement.requests.r1.status).toBe(
    'responded'
  );
});

it('bounds cancellation work per wake to the session write cap', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests: WindowManagementState['requests'] = {};
  for (let i = 0; i < MAX_SESSION_ROWS + 5; i++) {
    requests[`r${i}`] = openRow(i, i);
  }
  const store = makeStore(requests);

  const promise = sweepOrphanedRequests(store, requests);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  expect(tabs.sendMessage).toHaveBeenCalledTimes(MAX_SESSION_ROWS);
});

it('a per-row cancel failure is logged with identifiers only, never a raw URL', async () => {
  (collectRequestIdsFromOpenWindows as jest.Mock).mockResolvedValue(new Set());
  const requests = { r1: openRow(3, 0) };
  const store = makeStore(requests);
  const secretBearingError = new Error(
    'dispatch failed https://dapp/page?message=super-secret'
  );
  (store.dispatch as jest.Mock).mockImplementationOnce(() => {
    throw secretBearingError;
  });

  const promise = sweepOrphanedRequests(store, requests);
  await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
  await promise;

  const serialized = JSON.stringify((console.error as jest.Mock).mock.calls);
  expect(serialized).not.toContain('super-secret');
  expect(serialized).not.toMatch(/\?[^"]*=/);
});
