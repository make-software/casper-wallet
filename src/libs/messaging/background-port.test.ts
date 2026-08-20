import { runtime } from 'webextension-polyfill';

import {
  BACKGROUND_PORT_NAME,
  PORT_RESPONSE_TIMEOUT_MS,
  requestOverPort
} from './background-port';

jest.mock('webextension-polyfill', () => ({
  runtime: { connect: jest.fn() }
}));

const mockConnect = runtime.connect as jest.Mock;

/** A fake Port whose listeners the test drives directly. */
function makePort() {
  const messageListeners: ((message: unknown) => void)[] = [];
  const disconnectListeners: (() => void)[] = [];

  return {
    name: BACKGROUND_PORT_NAME,
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    onMessage: {
      addListener: (fn: (m: unknown) => void) => messageListeners.push(fn)
    },
    onDisconnect: {
      addListener: (fn: () => void) => disconnectListeners.push(fn)
    },
    emitMessage: (message: unknown) =>
      messageListeners.forEach(fn => fn(message)),
    emitDisconnect: () => disconnectListeners.forEach(fn => fn())
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  mockConnect.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

it('resolves with the first message and disconnects', async () => {
  const port = makePort();
  mockConnect.mockReturnValue(port);

  const pending = requestOverPort<{ status: string }>({ type: 'X' });
  port.emitMessage({ status: 'ok' });

  await expect(pending).resolves.toEqual({ status: 'ok' });
  expect(port.postMessage).toHaveBeenCalledWith({ type: 'X' });
  expect(port.disconnect).toHaveBeenCalled();
});

it('retries when the port disconnects before a response', async () => {
  const first = makePort();
  const second = makePort();
  mockConnect.mockReturnValueOnce(first).mockReturnValueOnce(second);

  const pending = requestOverPort<{ status: string }>({ type: 'X' });
  first.emitDisconnect();

  await jest.advanceTimersByTimeAsync(250);
  second.emitMessage({ status: 'ok' });

  await expect(pending).resolves.toEqual({ status: 'ok' });
  expect(mockConnect).toHaveBeenCalledTimes(2);
});

it('does not reconnect when the disconnect follows a response', async () => {
  const port = makePort();
  mockConnect.mockReturnValue(port);

  const pending = requestOverPort<{ status: string }>({ type: 'X' });
  port.emitMessage({ status: 'ok' });
  port.emitDisconnect();

  await expect(pending).resolves.toEqual({ status: 'ok' });
  expect(mockConnect).toHaveBeenCalledTimes(1);
});

it('rejects on the liveness backstop without retrying — a dropped message yields neither a response nor a disconnect', async () => {
  const port = makePort();
  mockConnect.mockReturnValue(port);

  const pending = requestOverPort({ type: 'X' });
  const assertion = expect(pending).rejects.toThrow(
    'Background port timed out'
  );

  await jest.advanceTimersByTimeAsync(PORT_RESPONSE_TIMEOUT_MS);
  await assertion;
  expect(mockConnect).toHaveBeenCalledTimes(1);
});

it('gives up after the configured retries', async () => {
  const ports = [makePort(), makePort(), makePort()];
  mockConnect
    .mockReturnValueOnce(ports[0])
    .mockReturnValueOnce(ports[1])
    .mockReturnValueOnce(ports[2]);

  const pending = requestOverPort({ type: 'X' });
  const assertion = expect(pending).rejects.toThrow(
    'Background port disconnected'
  );

  ports[0].emitDisconnect();
  await jest.advanceTimersByTimeAsync(250);
  ports[1].emitDisconnect();
  await jest.advanceTimersByTimeAsync(500);
  ports[2].emitDisconnect();

  await assertion;
  expect(mockConnect).toHaveBeenCalledTimes(3);
});
