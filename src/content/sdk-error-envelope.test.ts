jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(() => 'chrome-extension://abcdefghijklmnop/sdk.bundle.js'),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() }
  }
}));

jest.mock('@content/bring', () => ({ initBringScript: jest.fn() }));

const ORIGIN = 'https://dapp.example';

type Handler = (e: { data: unknown }) => void;

class FakePort {
  peer!: FakePort;
  onmessage: Handler | null = null;
  listeners: Handler[] = [];

  postMessage = (data: unknown) => {
    this.peer.onmessage?.({ data });
    this.peer.listeners.slice().forEach(cb => cb({ data }));
  };
  addEventListener = (type: string, cb: Handler) => {
    if (type === 'message') this.listeners.push(cb);
  };
  removeEventListener = (type: string, cb: Handler) => {
    this.listeners = this.listeners.filter(l => l !== cb);
  };
  start = () => undefined;
  close = () => undefined;
}

type MockedRuntime = {
  sendMessage: jest.Mock;
  getURL: jest.Mock;
  onMessage: { addListener: jest.Mock; removeListener: jest.Mock };
};

// `jest.resetModules()` re-invokes the `webextension-polyfill` mock factory,
// producing a brand-new `runtime` object. A top-level `import { runtime } from
// 'webextension-polyfill'` would bind to the pre-reset instance only, so a
// `mockRejectedValue` set on it would never reach the `index.ts` copy actually
// exercised below. Re-require the module *after* resetting, in the same
// post-reset registry `./index` just populated, and hand back that live
// instance for tests to configure and assert against.
//
// Loads sdk.ts FIRST (it registers the handshake listener at module load), then
// index.ts, then fires the injected script's onload — which is where
// establishSdkPort posts the port across. window.postMessage forwards it to
// sdk.ts in the shape `isTrustedWindowMessage` demands.
const loadBothModules = () => {
  const messageListeners: ((e: unknown) => void)[] = [];
  const scriptTags: { onload?: () => void; setAttribute: jest.Mock }[] = [];

  (global as { MessageChannel?: unknown }).MessageChannel = function () {
    const port1 = new FakePort();
    const port2 = new FakePort();
    port1.peer = port2;
    port2.peer = port1;
    return { port1, port2 };
  };

  const win = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, cb: (e: unknown) => void) => {
      if (type === 'message') messageListeners.push(cb);
    },
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
    postMessage: (data: unknown, origin: string, transfer: FakePort[]) => {
      messageListeners
        .slice()
        .forEach(cb => cb({ source: win, origin, data, ports: transfer }));
    }
  };

  (global as { window?: unknown }).window = win;
  (global as { document?: unknown }).document = {
    title: 'test dapp',
    head: {
      children: [{}],
      insertBefore: () => undefined,
      removeChild: () => undefined
    },
    createElement: () => {
      const tag = { setAttribute: jest.fn() } as (typeof scriptTags)[number];
      scriptTags.push(tag);
      return tag;
    }
  };
  (global as { CustomEvent?: unknown }).CustomEvent = class {
    constructor(
      public type: string,
      public init?: unknown
    ) {}
  };

  jest.resetModules();
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { CasperWalletProvider } = require('./sdk');
  require('./index');
  const runtime = require('webextension-polyfill').runtime as MockedRuntime;
  /* eslint-enable @typescript-eslint/no-require-imports */
  scriptTags[0].onload?.();

  return { CasperWalletProvider, runtime };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

it('rejects the SDK promise when the background send fails', async () => {
  const { CasperWalletProvider, runtime } = loadBothModules();
  runtime.sendMessage.mockRejectedValue(
    Error('Could not establish connection')
  );

  const provider = CasperWalletProvider({ timeout: 5000 });
  const settled = provider.getVersion().then(
    () => 'resolved',
    (e: unknown) => e
  );
  await flush();

  const outcome = await settled;
  expect(outcome).toBeInstanceOf(Error);
  expect((outcome as Error).message).toContain(
    'Could not establish connection'
  );
});

// The `error: true` flag is what routes the envelope to the reject branch. Drop
// it and the dapp treats a transport failure as a successful signature.
it('never takes the resolve branch for a failed send', async () => {
  const { CasperWalletProvider, runtime } = loadBothModules();
  runtime.sendMessage.mockRejectedValue(Error('boom'));

  const onResolve = jest.fn();
  const provider = CasperWalletProvider({ timeout: 5000 });
  provider.getVersion().then(onResolve, () => undefined);
  await flush();

  expect(onResolve).not.toHaveBeenCalled();
});

// Without the request's own meta on the envelope, the SDK's requestId filter
// discards it and the promise hangs until the timeout instead of rejecting.
it('rejects only the request that failed', async () => {
  const { CasperWalletProvider, runtime } = loadBothModules();
  runtime.sendMessage
    .mockRejectedValueOnce(Error('first failed'))
    .mockImplementation(() => new Promise(() => undefined));

  const provider = CasperWalletProvider({ timeout: 5000 });
  const first = provider.getVersion().then(
    () => 'resolved',
    (e: unknown) => (e as Error).message
  );
  const secondSettled = jest.fn();
  provider.getVersion().then(secondSettled, secondSettled);
  await flush();

  await expect(first).resolves.toContain('first failed');
  expect(secondSettled).not.toHaveBeenCalled();
});
