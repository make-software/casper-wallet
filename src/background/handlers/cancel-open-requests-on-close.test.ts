import { tabs } from 'webextension-polyfill';

import { emitSdkEventToActiveTabsWithOrigin } from '@background/utils';

import { sdkMethod } from '@content/sdk-method';

import {
  CANCEL_GRACE_MS,
  buildCancelResponse,
  cancelOpenRequestsForClosedWindow
} from './cancel-open-requests-on-close';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn() }
}));
jest.mock('@background/utils', () => ({
  emitSdkEventToActiveTabsWithOrigin: jest.fn()
}));

const state = (
  windowId: number | null,
  requests: any,
  pendingRequests: any
) => ({
  windowManagement: { windowId, requests, pendingRequests }
});
const closed = () =>
  expect.objectContaining({ type: expect.stringContaining('windowIdCleared') });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe('buildCancelResponse', () => {
  const c = (m: any) => buildCancelResponse(m, 'r');
  it('connect', () =>
    expect(c('connect')).toEqual(
      sdkMethod.connectResponse(false, { requestId: 'r' })
    ));
  it('switchAccount', () =>
    expect(c('switchAccount')).toEqual(
      sdkMethod.switchAccountResponse(false, { requestId: 'r' })
    ));
  it('sign', () =>
    expect(c('sign')).toEqual(
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r' })
    ));
  it('signMessage', () =>
    expect(c('signMessage')).toEqual(
      sdkMethod.signMessageResponse({ cancelled: true }, { requestId: 'r' })
    ));
  it('signTypedData', () =>
    expect(c('signTypedData')).toEqual(
      sdkMethod.signTypedDataResponse(
        {
          cancelled: true,
          signature: null,
          digest: null,
          publicKey: null,
          error: null
        },
        { requestId: 'r' }
      )
    ));
  it('decryptMessage', () =>
    expect(c('decryptMessage')).toEqual(
      sdkMethod.decryptMessageResponse({ cancelled: true }, { requestId: 'r' })
    ));
});

describe('cancelOpenRequestsForClosedWindow', () => {
  const run = async (getState: jest.Mock) => {
    const dispatch = jest.fn();
    const p = cancelOpenRequestsForClosedWindow(
      { dispatch, getState } as any,
      7
    );
    await jest.advanceTimersByTimeAsync(CANCEL_GRACE_MS);
    await p;
    return dispatch;
  };

  it('still open after grace → sends cancel, marks responded, clears windowId', async () => {
    (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
    const s = state(
      7,
      { r1: 'open' },
      { r1: { tabId: 3, origin: 'https://d', method: 'sign' } }
    );
    const dispatch = await run(jest.fn().mockReturnValue(s));
    expect(tabs.sendMessage).toHaveBeenCalledWith(
      3,
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('windowRequestResponded')
      })
    );
    expect(dispatch).toHaveBeenCalledWith(closed());
  });

  it('genuine response arrives during grace → not cancelled', async () => {
    const getState = jest
      .fn()
      .mockReturnValueOnce(
        state(
          7,
          { r1: 'open' },
          { r1: { tabId: 3, origin: 'o', method: 'sign' } }
        )
      )
      .mockReturnValue(
        state(
          7,
          { r1: 'responded' },
          { r1: { tabId: 3, origin: 'o', method: 'sign' } }
        )
      );
    const dispatch = await run(getState);
    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(closed());
  });

  it('new request opened during grace → not cancelled, windowId not cleared', async () => {
    (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
    const getState = jest
      .fn()
      .mockReturnValueOnce(
        state(
          7,
          { r1: 'open' },
          { r1: { tabId: 3, origin: 'o', method: 'sign' } }
        )
      )
      .mockReturnValue(
        state(
          99,
          { r1: 'open', r2: 'open' },
          {
            r1: { tabId: 3, origin: 'o', method: 'sign' },
            r2: { tabId: 4, origin: 'o', method: 'connect' }
          }
        )
      );
    const dispatch = await run(getState);
    expect(tabs.sendMessage).toHaveBeenCalledTimes(1);
    expect(tabs.sendMessage).toHaveBeenCalledWith(
      3,
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' })
    );
    expect(dispatch).not.toHaveBeenCalledWith(closed()); // windowId already moved to 99
  });

  it('nothing open → no send, clears windowId', async () => {
    const dispatch = jest.fn();
    const getState = jest
      .fn()
      .mockReturnValue(state(7, { r1: 'responded' }, {}));
    await cancelOpenRequestsForClosedWindow({ dispatch, getState } as any, 7);
    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(closed());
  });

  it('send fails, fallback delivers nothing → sagaError "not delivered"', async () => {
    (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('gone'));
    (emitSdkEventToActiveTabsWithOrigin as jest.Mock).mockResolvedValue(0);
    const dispatch = await run(
      jest
        .fn()
        .mockReturnValue(
          state(
            7,
            { r1: 'open' },
            { r1: { tabId: 3, origin: 'https://d', method: 'connect' } }
          )
        )
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          source: 'cancel-on-close',
          message: expect.stringContaining('not delivered')
        })
      })
    );
  });

  it('send fails, fallback delivers → sagaError "same-origin fallback"', async () => {
    (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('gone'));
    (emitSdkEventToActiveTabsWithOrigin as jest.Mock).mockResolvedValue(1);
    const dispatch = await run(
      jest
        .fn()
        .mockReturnValue(
          state(
            7,
            { r1: 'open' },
            { r1: { tabId: 3, origin: 'https://d', method: 'connect' } }
          )
        )
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          message: expect.stringContaining('same-origin fallback')
        })
      })
    );
  });
});
