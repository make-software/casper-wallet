import { tabs } from 'webextension-polyfill';

import { sdkMethod } from '@content/sdk-method';

import { failRequestOnWindowError } from './cancel-requests';
import { deliverViaOrigin } from './deliver-via-origin';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));
jest.mock('./deliver-via-origin', () => ({ deliverViaOrigin: jest.fn() }));

const open = (tabId: number, method = 'sign') => ({
  status: 'open',
  tabId,
  origin: 'https://dapp',
  method,
  windowIds: []
});

const state = (requests: any) => ({
  windowManagement: { windowId: null, exportKeysWindowId: null, requests }
});

beforeEach(() => {
  jest.clearAllMocks();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
});

it('found request → marks responded, surfaces sagaError, delivers the method-correct Cancel to its tab', async () => {
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'windowManagement/windowRequestResponded',
      payload: { requestId: 'r1' }
    })
  );
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'appEvents/sagaError',
      payload: expect.objectContaining({ source: 'open-window-failed' })
    })
  );
  expect(tabs.sendMessage).toHaveBeenCalledWith(
    3,
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
});

it('a different method builds its own Cancel shape', async () => {
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r2: open(9, 'connect') }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r2');

  expect(tabs.sendMessage).toHaveBeenCalledWith(
    9,
    sdkMethod.connectResponse(false, { requestId: 'r2' })
  );
});

it('tabs.sendMessage rejects → falls back to deliverViaOrigin', async () => {
  (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

  expect(deliverViaOrigin).toHaveBeenCalledWith(
    'https://dapp',
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
  );
});

it('both delivery routes fail → the banner says the site was not told', async () => {
  // The tombstone is already written by then, and `sdk-response-to-tab` drops
  // anything that arrives later, so this is terminal: the dapp got nothing and
  // will hang. Telling the user "the request was cancelled" is then wrong.
  (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'appEvents/sagaError',
      payload: expect.objectContaining({
        source: 'open-window-failed',
        message: expect.stringContaining('could not be told')
      })
    })
  );
});

it('unknown requestId → clean no-op, nothing dispatched, nothing sent', async () => {
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({}));

  await failRequestOnWindowError({ dispatch, getState } as any, 'ghost');

  expect(dispatch).not.toHaveBeenCalled();
  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(deliverViaOrigin).not.toHaveBeenCalled();
});

it('already-answered requestId (tombstoned) → clean no-op, nothing dispatched, nothing sent', async () => {
  const dispatch = jest.fn();
  const getState = jest
    .fn()
    .mockReturnValue(state({ r1: { status: 'responded' } }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

  expect(dispatch).not.toHaveBeenCalled();
  expect(tabs.sendMessage).not.toHaveBeenCalled();
  expect(deliverViaOrigin).not.toHaveBeenCalled();
});
