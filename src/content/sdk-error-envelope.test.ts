import { FakePort, installFakeDom } from './__fixtures';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(() => 'chrome-extension://abcdefghijklmnop/sdk.bundle.js'),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() }
  }
}));

jest.mock('@content/bring', () => ({ initBringScript: jest.fn() }));

const ORIGIN = 'https://dapp.example';

type MockedRuntime = {
  sendMessage: jest.Mock;
  getURL: jest.Mock;
  onMessage: { addListener: jest.Mock; removeListener: jest.Mock };
};

// Loads sdk.ts first (registers the handshake listener at module load), then
// index.ts, then fires the injected script's onload to hand off the port.
const loadBothModules = () => {
  const { scriptTags, messageListeners, win } = installFakeDom(ORIGIN);
  win.postMessage = (data: unknown, origin: string, transfer: FakePort[]) => {
    const event = { source: win, origin, data, ports: transfer };
    messageListeners.slice().forEach(cb => cb(event));
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
