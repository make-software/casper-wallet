import { requestWithRetry } from './request-with-retry';

// Mirrors the module's un-exported constants (kept module-private after
// WALLET-1424 removed `use-private-state.ts`, its only outside reader).
const FETCH_TIMEOUT_MS = 5000;
const RETRY_DELAYS_MS = [250, 500];

describe('requestWithRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the first attempt and leaves no pending timers', async () => {
    const send = jest.fn().mockResolvedValue('value');

    await expect(requestWithRetry(send)).resolves.toBe('value');

    expect(send).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('retries a rejecting first attempt after RETRY_DELAYS_MS[0] and can then succeed', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('Could not establish connection'))
      .mockResolvedValueOnce('value');

    const result = requestWithRetry(send);

    await jest.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] - 1);
    expect(send).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(send).toHaveBeenCalledTimes(2);

    await expect(result).resolves.toBe('value');
  });

  it('rejects with the last error after all attempts reject, after exactly RETRY_DELAYS_MS.length + 1 calls', async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(new Error('attempt-0'))
      .mockRejectedValueOnce(new Error('attempt-1'))
      .mockRejectedValueOnce(new Error('attempt-2'));

    const result = requestWithRetry(send);
    result.catch(() => undefined);
    await jest.runAllTimersAsync();

    await expect(result).rejects.toThrow('attempt-2');
    expect(send).toHaveBeenCalledTimes(1 + RETRY_DELAYS_MS.length);
  });

  it('times out an attempt whose promise never settles', async () => {
    const send = jest.fn(() => new Promise<never>(() => undefined));

    const result = requestWithRetry(send);
    result.catch(() => undefined);
    await jest.runAllTimersAsync();

    await expect(result).rejects.toThrow('timed out');
    expect(send).toHaveBeenCalledTimes(1 + RETRY_DELAYS_MS.length);
  });

  it('resets the timeout per attempt instead of accumulating it across retries', async () => {
    const send = jest
      .fn()
      .mockImplementationOnce(() => new Promise<never>(() => undefined))
      .mockResolvedValueOnce('value');

    const result = requestWithRetry(send);

    // First attempt exhausts its own full timeout window.
    await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS);
    expect(send).toHaveBeenCalledTimes(1);

    // Backoff, then the second attempt — already past a hypothetical
    // cumulative 5s budget, yet it still gets its own fresh window and
    // succeeds well inside it.
    await jest.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]);
    expect(send).toHaveBeenCalledTimes(2);

    await expect(result).resolves.toBe('value');
  });
});
