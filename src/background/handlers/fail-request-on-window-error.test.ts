import { tabs } from 'webextension-polyfill';

import { sdkMethod } from '@content/sdk-method';

import { failRequestOnWindowError } from './cancel-requests';
import { deliverViaOrigin } from './deliver-via-origin';

jest.mock('webextension-polyfill', () => ({
  tabs: { sendMessage: jest.fn(), get: jest.fn() }
}));
jest.mock('./deliver-via-origin', () => ({ deliverViaOrigin: jest.fn() }));

const open = (tabId: number, method = 'sign', frameId?: number) => ({
  status: 'open',
  tabId,
  origin: 'https://dapp',
  method,
  windowIds: [],
  ...(frameId === undefined ? {} : { frameId })
});

const state = (requests: any) => ({
  windowManagement: { windowId: null, exportKeysWindowId: null, requests }
});

beforeEach(() => {
  jest.clearAllMocks();
  (tabs.sendMessage as jest.Mock).mockResolvedValue(undefined);
  // Origin matches `open()`'s by default, so the direct-send branch runs
  // unless a test deliberately makes the tab look navigated-away.
  (tabs.get as jest.Mock).mockResolvedValue({ url: 'https://dapp/page' });
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
      payload: expect.objectContaining({
        source: 'open-window-failed',
        // Pins the delivered arm's TEXT. The banner renders it verbatim, and
        // the other arm tells the user the site may still be waiting — so
        // collapsing this ternary either way must fail a test.
        message: expect.stringContaining('the request was cancelled')
      })
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
    sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
    undefined
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

describe('#1484 origin check (inside the vehicle)', () => {
  it('a navigated-away tab gets deliverViaOrigin, not a direct send', async () => {
    (tabs.get as jest.Mock).mockResolvedValue({
      url: 'https://elsewhere/page'
    });
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(deliverViaOrigin).toHaveBeenCalledWith(
      'https://dapp',
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
      undefined
    );
  });

  it('an unresolvable live origin (tab gone) also routes via deliverViaOrigin', async () => {
    (tabs.get as jest.Mock).mockRejectedValue(new Error('No tab'));
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(deliverViaOrigin).toHaveBeenCalled();
  });

  it('a sub-frame request skips the origin check and sends frame-targeted, even on a mismatched top origin', async () => {
    (tabs.get as jest.Mock).mockResolvedValue({
      url: 'https://elsewhere/page'
    });
    const dispatch = jest.fn();
    const getState = jest
      .fn()
      .mockReturnValue(state({ r1: open(3, 'sign', 5) }));

    await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

    expect(tabs.get).not.toHaveBeenCalled();
    expect(tabs.sendMessage).toHaveBeenCalledWith(
      3,
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
      { frameId: 5 }
    );
  });

  it('a top-frame request (frameId 0) is still origin-checked', async () => {
    (tabs.get as jest.Mock).mockResolvedValue({
      url: 'https://elsewhere/page'
    });
    const dispatch = jest.fn();
    const getState = jest
      .fn()
      .mockReturnValue(state({ r1: open(3, 'sign', 0) }));

    await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(deliverViaOrigin).toHaveBeenCalledWith(
      'https://dapp',
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
      0
    );
  });
});

describe('policy parameter (source)', () => {
  it('explicit "open-window-failed" source matches the implicit default', async () => {
    (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
    (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError(
      { dispatch, getState } as any,
      'r1',
      'open-window-failed'
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'appEvents/sagaError',
        payload: expect.objectContaining({ source: 'open-window-failed' })
      })
    );
  });

  it('banner is suppressed for a non-open-window-failed source (console-only)', async () => {
    const consoleWarn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError(
      { dispatch, getState } as any,
      'r1',
      'sweep-orphaned-requests'
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'windowManagement/windowRequestResponded'
      })
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appEvents/sagaError' })
    );
    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('a suppressed-source delivery failure logs at error level, not warn', async () => {
    (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
    (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError(
      { dispatch, getState } as any,
      'r1',
      'sweep-orphaned-requests'
    );

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appEvents/sagaError' })
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('sweep-orphaned-requests'),
      expect.anything()
    );
    consoleError.mockRestore();
  });
});

it('never logs a raw URL or a raw Error — only redacted identifiers appear across any log line', async () => {
  // The rejection itself echoes the URL back, the way a real `tabs.sendMessage`
  // rejection can (`Could not establish connection` etc. sometimes quote the
  // target). If the vehicle ever logs this Error object directly instead of
  // `redactUrlQuery(error)`, `JSON.stringify` on a bare Error argument would
  // render `{}` and hide the leak from a whole-array serialization — so this
  // walks each logged argument individually instead.
  (tabs.sendMessage as jest.Mock).mockRejectedValue(
    new Error('tab gone: https://dapp/page?message=super-secret&x=1')
  );
  (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
  (tabs.get as jest.Mock).mockResolvedValue({
    url: 'https://dapp/page?message=super-secret&x=1'
  });
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const dispatch = jest.fn();
  const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

  await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

  expect(consoleError).toHaveBeenCalled();

  for (const call of consoleError.mock.calls) {
    for (const arg of call) {
      // A raw Error instance is refused outright: it would carry whatever the
      // rejection embedded, un-redacted, past this check entirely.
      expect(arg).not.toBeInstanceOf(Error);

      // `JSON.stringify` alone would miss a surgical revert of
      // `error: redactUrlQuery(error)` back to `error: error` inside the
      // object argument: `Error#message` is a non-enumerable own property, so
      // stringifying a raw Error renders `{}` and the secret text check below
      // would pass right past it. Walk every object argument's own values
      // directly instead of trusting the serialization to surface them.
      if (typeof arg === 'object' && arg != null) {
        for (const value of Object.values(arg)) {
          expect(value).not.toBeInstanceOf(Error);
        }
      }

      const text = typeof arg === 'string' ? arg : JSON.stringify(arg);
      expect(text).not.toContain('super-secret');
      expect(text).not.toMatch(/\?[^"]*=/);
    }
  }
  consoleError.mockRestore();
});
