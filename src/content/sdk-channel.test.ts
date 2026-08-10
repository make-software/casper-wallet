// Jest runs with `testEnvironment: 'node'` (no `jest-environment-jsdom`), so
// `window` is not a global here. `isTrustedWindowMessage` reads `window` and
// `window.location.origin` at call time, so a minimal stub must be installed
// before the module under test is required. A top-level `import` would run too
// early, so the module is `require`d lazily inside `loadChannel` after globals
// are set — the same pattern used in `sdk.test.ts`.
import type { isTrustedWindowMessage as IsTrustedWindowMessage } from './sdk-channel';

// `index.ts` pulls in `@content/bring` (which does top-level `await` against the
// bringweb3 kit) and `webextension-polyfill`. Neither is relevant to the guard,
// and the real `bring` module cannot evaluate under `testEnvironment: 'node'`,
// so both are mocked to nothing. This lets the hostile-page test load the real
// content-script entry and assert on the listeners it registers.
jest.mock('@content/bring', () => ({ initBringScript: jest.fn() }));
jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: (p: string) => p,
    sendMessage: jest.fn().mockResolvedValue(undefined),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() }
  }
}));

const ORIGIN = 'https://dapp.example';

const SDK_REQUEST_EVENT = 'CasperWalletMethod:Request';

const loadChannel = (): {
  isTrustedWindowMessage: typeof IsTrustedWindowMessage;
  SDK_HANDSHAKE_TYPE: string;
} => {
  (global as { window?: unknown }).window = {
    location: { origin: ORIGIN }
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./sdk-channel');
};

describe('isTrustedWindowMessage', () => {
  it('accepts same-window same-origin messages', () => {
    const { isTrustedWindowMessage } = loadChannel();
    const win = (global as { window: unknown }).window;
    expect(
      isTrustedWindowMessage({
        source: win,
        origin: ORIGIN
      } as unknown as MessageEvent)
    ).toBe(true);
  });

  it('rejects cross-origin messages (same window, evil origin)', () => {
    const { isTrustedWindowMessage } = loadChannel();
    const win = (global as { window: unknown }).window;
    expect(
      isTrustedWindowMessage({
        source: win,
        origin: 'https://evil.example'
      } as unknown as MessageEvent)
    ).toBe(false);
  });

  it('rejects messages from another window/source (iframe/other window)', () => {
    const { isTrustedWindowMessage } = loadChannel();
    expect(
      isTrustedWindowMessage({
        source: {},
        origin: ORIGIN
      } as unknown as MessageEvent)
    ).toBe(false);
  });
});

// Hostile-page guarantee: after moving requests onto the private port, the
// content-script entry must NOT register any listener for the old, forgeable
// `CasperWalletMethod:Request` window event. A page script that dispatches that
// event now reaches nothing — the request surface is gone. This drives the real
// production entry (`index.ts`) and inspects every window listener it registers.
describe('content script hostile-page surface', () => {
  it('registers no CasperWalletMethod:Request window listener', () => {
    jest.resetModules();

    const addEventListener = jest.fn();
    const scriptTag: Record<string, unknown> = {
      setAttribute: jest.fn(),
      onload: null,
      src: ''
    };
    const win = {
      location: { origin: ORIGIN },
      addEventListener,
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true),
      postMessage: jest.fn()
    };
    (global as { window?: unknown }).window = win;
    (global as { document?: unknown }).document = {
      head: {
        children: [],
        insertBefore: jest.fn(),
        removeChild: jest.fn()
      },
      documentElement: {},
      createElement: () => scriptTag
    };
    (global as { CustomEvent?: unknown }).CustomEvent = class {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./index');

    const registeredTypes = addEventListener.mock.calls.map(([type]) => type);

    // sanity: init() actually ran and wired something (guards against a false
    // pass where the module never registered any listener at all).
    expect(registeredTypes.length).toBeGreaterThan(0);
    // the security invariant: the forgeable request event has no listener.
    expect(registeredTypes).not.toContain(SDK_REQUEST_EVENT);
  });
});
