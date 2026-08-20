import { Runtime } from 'webextension-polyfill';

import { MainStore } from '@background/redux/get-main-store';
import { changePassword } from '@background/redux/sagas/actions';

import * as unlockRequestsModule from './unlock-requests';
import {
  ALLOWED_PAGES,
  CHANGE_PASSWORD_REQUEST_TYPE,
  attachPrivilegedPort,
  handlePrivilegedRequest,
  isAllowedPage
} from './privileged-port';
import {
  UNLOCK_REQUEST_TYPE,
  VERIFY_PASSWORD_REQUEST_TYPE
} from './unlock-requests';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'ext-id',
    getURL: (path: string) => `chrome-extension://ext-id/${path}`
  }
}));

jest.mock('./unlock-requests', () => ({
  ...jest.requireActual('./unlock-requests'),
  handleUnlockRequest: jest.fn()
}));

const POPUP_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/popup.html#/change-password'
} as Runtime.MessageSender;

const CONNECT_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/connect-to-app.html'
} as Runtime.MessageSender;

const ONBOARDING_SENDER = {
  id: 'ext-id',
  url: 'chrome-extension://ext-id/onboarding.html'
} as Runtime.MessageSender;

const WEB_PAGE_SENDER = {
  id: 'ext-id',
  url: 'https://evil.example/index.html'
} as Runtime.MessageSender;

// Same id and an allow-listed pathname, foreign origin. Every other fixture is
// already rejected by `isAllowedPage` on pathname alone, so without this one the
// `isTrustedUiSender` leg of the guard can be deleted with the suite still green.
const SPOOFED_ORIGIN_SENDER = {
  id: 'ext-id',
  url: 'https://evil.example/popup.html'
} as Runtime.MessageSender;

const FOREIGN_EXTENSION_SENDER = {
  id: 'some-other-extension-id',
  url: 'chrome-extension://some-other-extension-id/page.html'
} as Runtime.MessageSender;

const storeWithDispatch = () => {
  const dispatch = jest.fn();
  return { store: { dispatch } as unknown as MainStore, dispatch };
};

const validPayload = { currentPassword: 'old-one', password: 'new-one' };

describe('handlePrivilegedRequest — CHANGE_PASSWORD_REQUEST', () => {
  it('dispatches changePassword for the popup page', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        POPUP_SENDER,
        store
      )
    ).resolves.toEqual({ accepted: true });

    expect(dispatch).toHaveBeenCalledWith(changePassword(validPayload));
  });

  it('refuses a sender whose origin is not this extension', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        SPOOFED_ORIGIN_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a web-page sender', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        WEB_PAGE_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses an extension page that is not on the allowlist', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        CONNECT_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses an unknown request type', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest({ type: 'NOPE' }, POPUP_SENDER, store)
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('never logs the payload', async () => {
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const { store } = storeWithDispatch();

    await handlePrivilegedRequest(
      { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
      CONNECT_SENDER,
      store
    );

    expect(warn).toHaveBeenCalled();
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).not.toContain('old-one');
    expect(logged).not.toContain('new-one');
    warn.mockRestore();
  });

  it('does not warn for a sender outside this extension', async () => {
    const warn = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        FOREIGN_EXTENSION_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not dispatch changePassword for a different, allowed request type', async () => {
    const { store, dispatch } = storeWithDispatch();
    const OTHER_TYPE = 'OTHER_REQUEST_TYPE';
    const mutableAllowedPages = ALLOWED_PAGES as Record<
      string,
      readonly string[]
    >;
    mutableAllowedPages[OTHER_TYPE] = ['/popup.html'];

    try {
      // Passes the hasOwn check and the sender/page gate — same as a real
      // sub-handler request — but must not fall through into changePassword.
      await expect(
        handlePrivilegedRequest(
          { type: OTHER_TYPE, payload: validPayload },
          POPUP_SENDER,
          store
        )
      ).resolves.toBeNull();

      expect(dispatch).not.toHaveBeenCalled();
    } finally {
      delete mutableAllowedPages[OTHER_TYPE];
    }
  });

  it('refuses a sender with no url', async () => {
    const { store, dispatch } = storeWithDispatch();
    const NO_URL_SENDER = { id: 'ext-id' } as Runtime.MessageSender;

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload },
        NO_URL_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a malformed payload', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        {
          type: CHANGE_PASSWORD_REQUEST_TYPE,
          payload: { currentPassword: 'old-one' }
        },
        POPUP_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses an empty new password', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        {
          type: CHANGE_PASSWORD_REQUEST_TYPE,
          payload: { currentPassword: 'old-one', password: '' }
        },
        POPUP_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('refuses a request with no payload', async () => {
    const { store, dispatch } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        { type: CHANGE_PASSWORD_REQUEST_TYPE },
        POPUP_SENDER,
        store
      )
    ).resolves.toBeNull();

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('handlePrivilegedRequest — unlock routing', () => {
  const mockedHandleUnlockRequest =
    unlockRequestsModule.handleUnlockRequest as jest.Mock;

  beforeEach(() => {
    mockedHandleUnlockRequest.mockReset();
  });

  it('routes an UNLOCK_REQUEST from an allowed page to handleUnlockRequest', async () => {
    const { store } = storeWithDispatch();
    mockedHandleUnlockRequest.mockResolvedValue({ status: 'ok' });

    await expect(
      handlePrivilegedRequest(
        {
          type: UNLOCK_REQUEST_TYPE,
          payload: { password: 'x', attemptId: 'a' }
        },
        CONNECT_SENDER,
        store
      )
    ).resolves.toEqual({ status: 'ok' });
    expect(mockedHandleUnlockRequest).toHaveBeenCalledTimes(1);
  });

  it('refuses a VERIFY_PASSWORD_REQUEST from a web-page sender', async () => {
    const { store } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        {
          type: VERIFY_PASSWORD_REQUEST_TYPE,
          payload: { password: 'x', attemptId: 'a' }
        },
        WEB_PAGE_SENDER,
        store
      )
    ).resolves.toBeNull();
    expect(mockedHandleUnlockRequest).not.toHaveBeenCalled();
  });

  it('refuses an UNLOCK_REQUEST from the onboarding page (not on its allowlist)', async () => {
    const { store } = storeWithDispatch();

    await expect(
      handlePrivilegedRequest(
        {
          type: UNLOCK_REQUEST_TYPE,
          payload: { password: 'x', attemptId: 'a' }
        },
        ONBOARDING_SENDER,
        store
      )
    ).resolves.toBeNull();
    expect(mockedHandleUnlockRequest).not.toHaveBeenCalled();
  });
});

describe('isAllowedPage', () => {
  it('is false when the sender has no url', () => {
    const NO_URL_SENDER = { id: 'ext-id' } as Runtime.MessageSender;

    expect(isAllowedPage(CHANGE_PASSWORD_REQUEST_TYPE, NO_URL_SENDER)).toBe(
      false
    );
  });
});

describe('attachPrivilegedPort', () => {
  const flush = () => new Promise(resolve => setImmediate(resolve));

  function makePort(sender: Runtime.MessageSender) {
    const listeners: ((message: unknown) => void)[] = [];
    return {
      sender,
      postMessage: jest.fn(),
      disconnect: jest.fn(),
      onMessage: {
        addListener: (fn: (m: unknown) => void) => listeners.push(fn)
      },
      emit: (message: unknown) => listeners.forEach(fn => fn(message)),
      listenerCount: () => listeners.length
    } as unknown as Runtime.Port & {
      emit: (m: unknown) => void;
      listenerCount: () => number;
    };
  }

  it('attaches the message listener synchronously, so a message that arrives before the store is ready is still handled', async () => {
    const { store, dispatch } = storeWithDispatch();
    let releaseStore: (value: MainStore) => void = () => undefined;
    const slowStore = new Promise<MainStore>(resolve => {
      releaseStore = resolve;
    });

    const port = makePort(POPUP_SENDER);
    attachPrivilegedPort(port, () => slowStore);

    // The listener must exist before the store resolves — this is the cold
    // service-worker-start case that would otherwise hang the UI forever.
    expect(port.listenerCount()).toBe(1);

    port.emit({ type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload });
    releaseStore(store);
    await flush();

    expect(dispatch).toHaveBeenCalledWith(changePassword(validPayload));
    expect(port.postMessage).toHaveBeenCalledWith({ accepted: true });
  });

  it('disconnects without answering when the request is refused', async () => {
    const { store } = storeWithDispatch();
    const port = makePort(WEB_PAGE_SENDER);
    attachPrivilegedPort(port, () => Promise.resolve(store));

    port.emit({ type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload });
    await flush();

    expect(port.postMessage).not.toHaveBeenCalled();
    expect(port.disconnect).toHaveBeenCalled();
  });

  it('disconnects when the handler chain throws, and never logs the raw error', async () => {
    const error = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const thrown = new Error('store init failed') as Error & {
      action?: unknown;
    };
    // Simulate a middleware that attaches the dispatched action (and thus
    // the payload) to the thrown error, to prove it is never logged as-is.
    thrown.action = changePassword(validPayload);
    const port = makePort(POPUP_SENDER);
    attachPrivilegedPort(port, () => Promise.reject(thrown));

    port.emit({ type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload });
    await flush();

    expect(port.postMessage).not.toHaveBeenCalled();
    expect(port.disconnect).toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      'privileged port: handler failed',
      'store init failed'
    );

    const logged = JSON.stringify(error.mock.calls);
    expect(logged).not.toContain('old-one');
    expect(logged).not.toContain('new-one');
    error.mockRestore();
  });

  it('logs "unknown" when the thrown value is not an Error', async () => {
    const error = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const port = makePort(POPUP_SENDER);
    attachPrivilegedPort(port, () => Promise.reject('not an Error instance'));

    port.emit({ type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload });
    await flush();

    expect(error).toHaveBeenCalledWith(
      'privileged port: handler failed',
      'unknown'
    );
    error.mockRestore();
  });

  it('treats a missing port.sender as untrusted', async () => {
    const { store, dispatch } = storeWithDispatch();
    const port = makePort(undefined as unknown as Runtime.MessageSender);
    attachPrivilegedPort(port, () => Promise.resolve(store));

    port.emit({ type: CHANGE_PASSWORD_REQUEST_TYPE, payload: validPayload });
    await flush();

    expect(dispatch).not.toHaveBeenCalled();
    expect(port.disconnect).toHaveBeenCalled();
  });
});
