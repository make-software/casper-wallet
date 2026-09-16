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
        // Pins the delivered arm's TEXT: the banner renders it verbatim, and the
        // other arm tells the user the site may still be waiting.
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
  // The tombstone is already written and anything arriving later is dropped, so
  // this is terminal: "the request was cancelled" would be wrong.
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
  it('a navigated-away tab gets deliverViaOrigin, not a direct send, and logs identifiers + origins only', async () => {
    (tabs.get as jest.Mock).mockResolvedValue({
      url: 'https://elsewhere/page'
    });
    (deliverViaOrigin as jest.Mock).mockResolvedValue(1);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const dispatch = jest.fn();
    const getState = jest.fn().mockReturnValue(state({ r1: open(3, 'sign') }));

    await failRequestOnWindowError({ dispatch, getState } as any, 'r1');

    expect(tabs.sendMessage).not.toHaveBeenCalled();
    expect(deliverViaOrigin).toHaveBeenCalledWith(
      'https://dapp',
      sdkMethod.signResponse({ cancelled: true }, { requestId: 'r1' }),
      undefined
    );
    // Identifiers and origins only — never the tab's URL (`https://elsewhere/page`).
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('response withheld'),
      {
        requestId: 'r1',
        tabId: 3,
        expectedOrigin: 'https://dapp',
        liveOrigin: 'https://elsewhere',
        delivered: 1
      }
    );
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain('/page');
    consoleError.mockRestore();
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

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'windowManagement/windowRequestResponded'
      })
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appEvents/sagaError' })
    );
    expect(consoleWarn).toHaveBeenCalled();
    // The other collapse direction: a delivered response must not ALSO log at
    // error level.
    expect(consoleError).not.toHaveBeenCalled();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });

  it('a suppressed-source delivery failure logs at error level, not warn', async () => {
    (tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('tab gone'));
    (deliverViaOrigin as jest.Mock).mockResolvedValue(0);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
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

    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'appEvents/sagaError' })
    );
    // The `sendMessage` rejection above logs its own error line first, so a loose
    // `stringContaining(source)` match would pass with the ternary collapsed to `warn`.
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('cancelled an orphaned request'),
      expect.anything()
    );
    expect(consoleWarn).not.toHaveBeenCalled();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

it('never logs a raw URL or a raw Error — only redacted identifiers appear across any log line', async () => {
  // The rejection echoes the URL back, the way a real `tabs.sendMessage` rejection
  // can, and a bare Error stringifies to `{}` — so each argument is walked singly.
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

      // `Error#message` is non-enumerable, so a raw Error nested in an object
      // argument renders `{}` and the secret-text check below would miss it.
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
