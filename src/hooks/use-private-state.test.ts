import { fetchPrivateState } from '@background/handlers/private-state';

import {
  PRIVATE_STATE_RETRY_DELAYS_MS,
  loadPrivateStateWithRetry
} from './use-private-state';

jest.mock('@background/handlers/private-state', () => ({
  fetchPrivateState: jest.fn()
}));

// `use-private-state` imports `webextension-polyfill` directly (to listen for
// the payload-free `privateStateUpdated` push signal), which throws outside a
// browser extension. Stub it so the module can load under this node-env suite.
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}));

const fetchMock = fetchPrivateState as jest.MockedFunction<
  typeof fetchPrivateState
>;

const privateState = {
  passwordHash: 'password-hash',
  passwordSaltHash: 'password-salt-hash',
  keyDerivationSaltHash: 'key-derivation-salt-hash',
  vaultCipher: 'vault-cipher'
};

describe('loadPrivateStateWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the fetched state on first success and leaves no pending timers', async () => {
    fetchMock.mockResolvedValue(privateState);

    await expect(loadPrivateStateWithRetry()).resolves.toEqual(privateState);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('recovers when the first attempt rejects and a retry succeeds (SW-restart race)', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('Could not establish connection'))
      .mockResolvedValueOnce(privateState);

    const result = loadPrivateStateWithRetry();
    await jest.runAllTimersAsync();

    await expect(result).resolves.toEqual(privateState);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('waits the backoff delay before re-attempting', async () => {
    fetchMock.mockRejectedValue(new Error('Could not establish connection'));

    const result = loadPrivateStateWithRetry();
    result.catch(() => undefined);

    await jest.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(PRIVATE_STATE_RETRY_DELAYS_MS[0] - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await jest.runAllTimersAsync();
  });

  it('rejects with the last error after all attempts reject', async () => {
    fetchMock.mockRejectedValue(new Error('Could not establish connection'));

    const result = loadPrivateStateWithRetry();
    result.catch(() => undefined);
    await jest.runAllTimersAsync();

    await expect(result).rejects.toThrow('Could not establish connection');
    expect(fetchMock).toHaveBeenCalledTimes(
      1 + PRIVATE_STATE_RETRY_DELAYS_MS.length
    );
  });

  it('times out an attempt whose promise never settles (untrusted-sender no-response path)', async () => {
    fetchMock.mockImplementation(() => new Promise(() => undefined));

    const result = loadPrivateStateWithRetry();
    result.catch(() => undefined);
    await jest.runAllTimersAsync();

    await expect(result).rejects.toThrow('timed out');
    expect(fetchMock).toHaveBeenCalledTimes(
      1 + PRIVATE_STATE_RETRY_DELAYS_MS.length
    );
  });
});
