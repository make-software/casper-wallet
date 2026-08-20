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
    delete (globalThis as { Worker?: unknown }).Worker;
    jest.dontMock('./spawn-scrypt-worker');
    jest.resetModules();
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
