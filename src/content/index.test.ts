import { FakePort, installFakeDom } from './__fixtures';
import { sdkMethod } from './sdk-method';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn(() => 'chrome-extension://abcdefghijklmnop/sdk.bundle.js'),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() }
  }
}));

// After `jest.resetModules()`, a top-level `import { runtime }` binds to a
// dead mock; assertions must use the live instance `loadContentScript` re-requires.
type MockedRuntime = {
  sendMessage: jest.Mock;
  getURL: jest.Mock;
  onMessage: { addListener: jest.Mock; removeListener: jest.Mock };
};

jest.mock('@content/bring', () => ({ initBringScript: jest.fn() }));

const ORIGIN = 'https://dapp.example';

const loadContentScript = () => {
  const { channelRef, scriptTags, messageListeners, cleanupListeners, win } =
    installFakeDom(ORIGIN);
  const posted: {
    data: { type?: string };
    origin: string;
    transfer: FakePort[];
  }[] = [];
  win.postMessage = (data: unknown, origin: string, transfer: FakePort[]) => {
    posted.push({ data: data as { type?: string }, origin, transfer });
  };

  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./index');
  // Re-require *after* resetting, in the same (post-reset) module registry
  // `./index` just populated, so this is the exact `runtime` instance bound
  // inside the freshly loaded content script.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const runtime = require('webextension-polyfill').runtime as MockedRuntime;
  runtime.sendMessage.mockResolvedValue(undefined);

  // `establishSdkPort` runs from the injected script's onload handler.
  scriptTags[0].onload?.();

  return {
    channel: channelRef.current!,
    posted,
    messageListeners,
    cleanupListeners,
    win,
    runtime
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const REQUEST_TYPES = [
  sdkMethod.connectRequest.type,
  sdkMethod.switchAccountRequest.type,
  sdkMethod.signRequest.type,
  sdkMethod.signMessageRequest.type,
  sdkMethod.signTypedDataRequest.type,
  sdkMethod.encryptMessageRequest.type,
  sdkMethod.decryptMessageRequest.type,
  sdkMethod.disconnectRequest.type,
  sdkMethod.isConnectedRequest.type,
  sdkMethod.getActivePublicKeyRequest.type,
  sdkMethod.getVersionRequest.type,
  sdkMethod.getActivePublicKeySupportsRequest.type
];

const meta = { requestId: 'req-1' };

describe('establishSdkPort request gate', () => {
  it('hands the SDK a port, origin-scoped to this document', () => {
    const { posted, channel } = loadContentScript();

    expect(posted).toHaveLength(1);
    expect(posted[0].origin).toBe(ORIGIN);
    expect(posted[0].transfer[0]).toBe(channel.port2);
  });

  it('relays every one of the twelve request types', () => {
    const { channel, runtime } = loadContentScript();

    REQUEST_TYPES.forEach((type, i) => {
      channel.port2.postMessage({ type, payload: {}, meta });
      expect(runtime.sendMessage).toHaveBeenCalledTimes(i + 1);
    });
  });

  // Pinning the exact request-direction strings is what stops a forged
  // response envelope or a redux action from reaching the background
  // (defence-in-depth for P0.2). Relaxing the gate to `isSDKMethod` alone
  // must fail here.
  it.each([
    ['a response envelope', sdkMethod.signResponse.type],
    ['an error envelope', sdkMethod.signError.type],
    ['a connect response', sdkMethod.connectResponse.type],
    ['a redux action', 'vault/accountAdded']
  ])('drops %s', (_label, type) => {
    const { channel, runtime } = loadContentScript();

    channel.port2.postMessage({ type, payload: {}, meta });

    expect(runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('drops a shape-invalid message', () => {
    const { channel, runtime } = loadContentScript();

    channel.port2.postMessage({ nope: true });
    channel.port2.postMessage('string');
    channel.port2.postMessage(undefined);

    expect(runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('relays a background response back over the private port', async () => {
    const response = {
      type: sdkMethod.signResponse.type,
      payload: { signatureHex: 'deadbeef' },
      meta
    };

    const { channel, runtime } = loadContentScript();
    runtime.sendMessage.mockResolvedValue(response);
    const received: unknown[] = [];
    channel.port2.onmessage = e => received.push(e.data);

    channel.port2.postMessage({
      type: sdkMethod.signRequest.type,
      payload: {},
      meta
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(received).toEqual([response]);
  });
});

// Reaching the `activePort == null` branch means running cleanup() first —
// the module wires it to a window event listener, which the harness captured
// in `cleanupListeners`.
describe('delayed response with no active port', () => {
  it('logs the type and requestId, never the payload', () => {
    const { cleanupListeners, channel, runtime } = loadContentScript();
    const onMessage = runtime.onMessage.addListener.mock.calls[0][0];

    cleanupListeners.forEach(cb => cb());
    expect(channel.port1.closed).toBe(true);

    onMessage({
      type: sdkMethod.signResponse.type,
      payload: { signatureHex: 'deadbeefcafe' },
      meta: { requestId: 'req-9' }
    });

    // SECURITY: the payload of a delayed response carries signatureHex /
    // encryptedMessage — type + requestId only.
    expect(console.error).toHaveBeenCalledWith(
      'Content: dropped a delayed SDK response, no active port:',
      sdkMethod.signResponse.type,
      'req-9'
    );
    expect(
      JSON.stringify((console.error as jest.Mock).mock.calls)
    ).not.toContain('deadbeefcafe');
  });

  it('stops relaying requests once the port is closed', () => {
    const { cleanupListeners, channel, runtime } = loadContentScript();

    cleanupListeners.forEach(cb => cb());
    channel.port2.postMessage({
      type: sdkMethod.signRequest.type,
      payload: {},
      meta
    });

    expect(runtime.sendMessage).not.toHaveBeenCalled();
  });
});
