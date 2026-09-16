// `testEnvironment: 'node'` has no `window` global, and `isTrustedWindowMessage`
// reads it at call time, so the module is `require`d lazily after a stub is set.
import type { isTrustedWindowMessage as IsTrustedWindowMessage } from './sdk-channel';

// The real `@content/bring` cannot evaluate under `testEnvironment: 'node'`, and
// neither it nor the polyfill is relevant to the guard.
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

// Hostile-page guarantee: the content-script entry must register no listener for
// the forgeable `CasperWalletMethod:Request` window event.
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
    expect(registeredTypes).not.toContain(SDK_REQUEST_EVENT);
  });
});
