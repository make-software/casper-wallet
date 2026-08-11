import type {
  CasperWalletProvider as CasperWalletProviderFactory,
  SignatureResponse
} from './sdk';
import { SDK_HANDSHAKE_TYPE } from './sdk-channel';
import { SdkErrorCode, SignTypedDataResult } from './sdk-types';

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

describe('CasperWalletProvider pre-handshake queueing', () => {
  // `window.CasperWalletProvider` is live before the content-script handshake
  // delivers the port. A request fired in that gap must be parked and flushed
  // once the port arrives — never hard-rejected (the pre-DEP-99 window listener
  // always existed, so this preserves that behaviour). Fake timers keep the
  // per-request timeout from firing (or leaking as an open handle) unless a test
  // explicitly advances it.
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('parks a request fired before the handshake and flushes it once the port arrives', () => {
    const { CasperWalletProvider, window } = loadSdk();
    const provider = CasperWalletProvider();

    const onReject = jest.fn();
    // fired while `sdkPort` is still null
    provider.getVersion().catch(onReject);

    const port = makeFakePort();
    // parked: nothing posted yet and — crucially — not hard-rejected
    expect(port.postMessage).not.toHaveBeenCalled();
    expect(onReject).not.toHaveBeenCalled();

    const win = (global as { window: unknown }).window;
    window.messageListeners.forEach(cb =>
      cb({
        source: win,
        origin: ORIGIN,
        data: { type: SDK_HANDSHAKE_TYPE },
        ports: [port]
      })
    );

    // the parked request is now flushed onto the private port
    expect(port.postMessage).toHaveBeenCalledTimes(1);
    expect((port.postMessage.mock.calls[0][0] as { type: string }).type).toBe(
      'CasperWalletProvider:GetVersion'
    );
  });

  it('times out a parked request when the handshake never completes, and never sends it late', async () => {
    const { CasperWalletProvider, window } = loadSdk();
    const provider = CasperWalletProvider({ timeout: 1000 });

    const onReject = jest.fn();
    provider.getVersion().catch(onReject);

    // no handshake — advance past the per-request timeout
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(onReject).toHaveBeenCalledTimes(1);
    expect((onReject.mock.calls[0][0] as Error).message).toMatch(
      /SDK RESPONSE TIMEOUT/
    );

    // a late handshake must NOT resurrect the already-timed-out request
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
    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it('drops a timed-out parked request from the queue (no retention)', async () => {
    const { CasperWalletProvider, window } = loadSdk();
    const provider = CasperWalletProvider({ timeout: 1000 });

    // parked, then timed out — must be removed from the queue, not just
    // neutralized by the `settled` guard (the closure retains the full
    // requestAction, e.g. a deploy JSON for `sign`).
    provider.getVersion().catch(() => undefined);
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    // a later request + handshake must flush exactly ONE message — the live
    // request, not the expired one still sitting in the queue.
    provider.getVersion().catch(() => undefined);
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

    expect(port.postMessage).toHaveBeenCalledTimes(1);
  });
});

// Compile-level: a dapp must be able to branch on the marker WITHOUT a cast —
// TS consumers are the audience most likely to handle the refusal properly, and
// ts-jest type-checks this file, so dropping `errorCode` from either public
// result type fails here rather than silently shipping a JS-only guarantee.
describe('a wallet-generated refusal is readable from the public types', () => {
  it('exposes `errorCode` on both signature result types after narrowing', () => {
    const deployRefusal: SignatureResponse = {
      cancelled: true,
      message: 'Too many pending signature requests',
      errorCode: SdkErrorCode.tooManyPendingRequests
    };
    const typedDataRefusal: SignTypedDataResult = {
      cancelled: true,
      signature: null,
      digest: null,
      publicKey: null,
      error: 'Too many pending signature requests',
      errorCode: SdkErrorCode.tooManyPendingRequests
    };

    const codes = deployRefusal.cancelled
      ? [deployRefusal.errorCode, typedDataRefusal.errorCode]
      : [];

    expect(codes).toEqual([
      SdkErrorCode.tooManyPendingRequests,
      SdkErrorCode.tooManyPendingRequests
    ]);
  });
});
