import type { CasperWalletProvider as CasperWalletProviderFactory } from './sdk';
import { SDK_HANDSHAKE_TYPE } from './sdk-channel';

// The project's jest config runs with `testEnvironment: 'node'` (no
// `jest-environment-jsdom` dependency is installed), so `window`/`document`
// don't exist as globals here. `sdk.ts` touches both at module-evaluation
// time (it registers a `window` message listener for the handshake and assigns
// `window.CasperWalletProvider = ...` at the bottom of the file) and at call
// time (`document.title`), so the minimal stand-ins below must be in place
// *before* the module is required. A top-level `import` would run too early for
// that (module side effects execute at import time), so the module under test is
// `require`d lazily inside the loader after the globals are set.
const ORIGIN = 'https://dapp.example';

type Listener = (e: unknown) => void;

const loadSdk = (): {
  CasperWalletProvider: typeof CasperWalletProviderFactory;
  window: { messageListeners: Listener[] };
} => {
  const messageListeners: Listener[] = [];
  const win = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, cb: Listener) => {
      if (type === 'message') {
        messageListeners.push(cb);
      }
    },
    removeEventListener: () => undefined,
    dispatchEvent: () => true
  };
  (global as { window?: unknown }).window = win;
  (global as { document?: unknown }).document = { title: 'test dapp' };

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('./sdk');
  return { ...mod, window: { messageListeners } };
};

// A fake MessagePort: `sdk.ts` posts requests via `postMessage` and listens for
// responses via `addEventListener('message', ...)`. We only need to capture the
// posted requests here (responses never arrive; the per-call timeout rejects).
const makeFakePort = () => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  start: jest.fn()
});

describe('CasperWalletProvider requestId', () => {
  // Each test loads a fresh copy of `sdk.ts` (it registers its `window` message
  // listener at module-evaluation time against whatever `global.window` is
  // current then). Without resetting the module registry between tests, the
  // second `loadSdk()` call would return the first test's cached module —
  // still bound to the first test's fake window/port.
  beforeEach(() => {
    jest.resetModules();
  });

  it('generates unique, non-sequential request ids (over the private port)', () => {
    const { CasperWalletProvider, window } = loadSdk();

    // complete the handshake so `sdk.ts` captures the port that requests ride.
    const port = makeFakePort();
    const win = (global as { window: unknown }).window;
    window.messageListeners.forEach(cb =>
      cb({
        source: win,
        origin: ORIGIN,
        data: { type: SDK_HANDSHAKE_TYPE },
        ports: [port]
      })
    );

    // A short timeout keeps the internal `setTimeout` (default 30 min) from
    // outliving the test as an open handle — the calls below are never resolved
    // by a real response, only by this timeout firing.
    const provider = CasperWalletProvider({ timeout: 1 });
    provider.requestConnection().catch(() => undefined);
    provider.requestConnection().catch(() => undefined);

    // requests are now posted on the port, not dispatched as window events.
    const ids = port.postMessage.mock.calls
      .map(
        ([msg]) => (msg as { meta?: { requestId?: string } })?.meta?.requestId
      )
      .filter(Boolean) as string[];

    const unique = new Set(ids);
    expect(unique.size).toBe(2);
    unique.forEach(id => expect(id).toMatch(/[0-9a-f-]{36}/));
  });

  it('falls back to a crypto.getRandomValues-based UUID v4 when crypto.randomUUID is unavailable (non-secure http context)', () => {
    // `crypto.randomUUID` is only defined in a secure context. The content
    // script also matches plain `http://*/*` dapps, where `randomUUID` is
    // `undefined` but `getRandomValues` remains available. Simulate that by
    // stubbing `randomUUID` away for this test only, then restoring it.
    const originalRandomUUID = crypto.randomUUID;
    const getRandomValuesSpy = jest.spyOn(crypto, 'getRandomValues');
    (crypto as unknown as { randomUUID: unknown }).randomUUID = undefined;

    try {
      const { CasperWalletProvider, window } = loadSdk();

      const port = makeFakePort();
      const win = (global as { window: unknown }).window;
      window.messageListeners.forEach(cb =>
        cb({
          source: win,
          origin: ORIGIN,
          data: { type: SDK_HANDSHAKE_TYPE },
          ports: [port]
        })
      );

      const provider = CasperWalletProvider({ timeout: 1 });
      provider.requestConnection().catch(() => undefined);
      provider.requestConnection().catch(() => undefined);

      const ids = port.postMessage.mock.calls
        .map(
          ([msg]) => (msg as { meta?: { requestId?: string } })?.meta?.requestId
        )
        .filter(Boolean) as string[];

      expect(ids).toHaveLength(2);
      const v4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      ids.forEach(id => expect(id).toMatch(v4Regex));
      expect(new Set(ids).size).toBe(2);
      expect(getRandomValuesSpy).toHaveBeenCalled();
    } finally {
      (crypto as unknown as { randomUUID: unknown }).randomUUID =
        originalRandomUUID;
      getRandomValuesSpy.mockRestore();
    }
  });
});
