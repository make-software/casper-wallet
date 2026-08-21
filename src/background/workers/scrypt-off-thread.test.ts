import { convertBytesToHex } from '@libs/crypto/utils';

const SALT = '00'.repeat(32);

describe('scrypt-off-thread — inline fallback (no Worker, i.e. the MV3 service worker)', () => {
  it('derives a 32-byte key', async () => {
    const { deriveScryptKey } = await import('./scrypt-off-thread');

    await expect(deriveScryptKey('pass', SALT)).resolves.toHaveLength(32);
  });

  it('verifies a password against its own digest and rejects a wrong one', async () => {
    const { encodePasswordOffThread, verifyPasswordOffThread } =
      await import('./scrypt-off-thread');
    const hash = await encodePasswordOffThread('pass', SALT);

    await expect(verifyPasswordOffThread(hash, SALT, 'pass')).resolves.toBe(
      true
    );
    await expect(verifyPasswordOffThread(hash, SALT, 'nope')).resolves.toBe(
      false
    );
  });

  it('matches the hashing module it stands in for', async () => {
    const { encodePassword } = await import('@libs/crypto/hashing');
    const { encodePasswordOffThread } = await import('./scrypt-off-thread');

    await expect(encodePasswordOffThread('pass', SALT)).resolves.toBe(
      await encodePassword('pass', SALT)
    );
  });
});

describe('scrypt-off-thread — worker offload (the MV2 background page)', () => {
  const key = new Uint8Array(32).fill(7);
  let worker: {
    onmessage: ((event: { data: unknown }) => void) | null;
    onerror: (() => void) | null;
    postMessage: jest.Mock;
    terminate: jest.Mock;
  };

  const loadWithWorker = async () => {
    jest.resetModules();
    jest.doMock('./spawn-scrypt-worker', () => ({
      spawnScryptWorker: () => worker
    }));

    return import('./scrypt-off-thread');
  };

  beforeEach(() => {
    worker = {
      onmessage: null,
      onerror: null,
      postMessage: jest.fn(),
      terminate: jest.fn()
    };
    (globalThis as { Worker?: unknown }).Worker = function () {};
  });

  afterEach(() => {
    jest.useRealTimers();
    delete (globalThis as { Worker?: unknown }).Worker;
    jest.dontMock('./spawn-scrypt-worker');
    jest.resetModules();
  });

  // A worker that never answers must not hold the serialised derivation queue in
  // `unlock-requests.ts` open: that queue chains on one promise, and a pending
  // one can never be displaced, so every later unlock would wedge until the
  // background restarts.
  it('rejects and terminates the worker when the derivation never settles', async () => {
    const { deriveScryptKey } = await loadWithWorker();
    jest.useFakeTimers();
    const pending = deriveScryptKey('pass', SALT);
    const settled = jest.fn();
    pending.then(settled, settled);

    // Well past any plausible derivation: the assertion is that a deadline
    // exists at all, not what its exact value is.
    await jest.advanceTimersByTimeAsync(120_000);

    await expect(pending).rejects.toThrow('Key derivation timed out');
    expect(worker.terminate).toHaveBeenCalled();
  });

  // Without this the deadline above is satisfied by any value, including 0 — a
  // derivation slower than the timeout would be reported as a failed attempt.
  it('does not time out a derivation that is merely slow', async () => {
    const { deriveScryptKey } = await loadWithWorker();
    jest.useFakeTimers();
    const pending = deriveScryptKey('pass', SALT);
    const settled = jest.fn();
    pending.then(settled, settled);

    // An order of magnitude past a measured derivation (~350ms), still well
    // inside the deadline.
    await jest.advanceTimersByTimeAsync(5_000);
    expect(settled).not.toHaveBeenCalled();

    worker.onmessage?.({ data: { key } });

    await expect(pending).resolves.toBe(key);
  });

  it('sends the password and salt to the worker and resolves with its key', async () => {
    const { deriveScryptKey } = await loadWithWorker();
    const pending = deriveScryptKey('pass', SALT);

    expect(worker.postMessage).toHaveBeenCalledWith({
      password: 'pass',
      saltHash: SALT
    });

    worker.onmessage?.({ data: { key } });

    await expect(pending).resolves.toBe(key);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('rejects — and does not leak the password — when the worker reports failure', async () => {
    const { deriveScryptKey } = await loadWithWorker();
    const pending = deriveScryptKey('pass', SALT);

    worker.onmessage?.({ data: { error: true } });

    await expect(pending).rejects.toThrow('Key derivation failed');
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('rejects when the worker fails to start at all', async () => {
    const { deriveScryptKey } = await loadWithWorker();
    const pending = deriveScryptKey('pass', SALT);

    worker.onerror?.();

    await expect(pending).rejects.toThrow('Key derivation failed');
  });

  it('hexes the worker key for verification, without deriving inline', async () => {
    const { encodePasswordOffThread } = await loadWithWorker();
    const pending = encodePasswordOffThread('pass', SALT);

    worker.onmessage?.({ data: { key } });

    await expect(pending).resolves.toBe(convertBytesToHex(key));
  });
});
