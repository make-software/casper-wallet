import { isWorkerError } from './types';

jest.mock('@libs/crypto/hashing', () => ({
  generateRandomSaltHex: jest.fn(() => 'salt'),
  encodePassword: jest.fn(async () => 'hash'),
  deriveEncryptionKey: jest.fn(async () => new Uint8Array([1])),
  verifyPasswordAgainstHash: jest.fn(async () => true)
}));
jest.mock('@libs/crypto/utils', () => ({
  convertBytesToHex: jest.fn(() => 'key')
}));
jest.mock('@libs/crypto/vault', () => ({
  encryptVault: jest.fn(async () => 'cipher'),
  decryptVault: jest.fn(async () => ({ accounts: [] }))
}));

type WorkerGlobals = {
  onmessage?: (event: { data: unknown }) => Promise<void>;
  postMessage?: (message: unknown) => void;
};

const workerGlobals = globalThis as unknown as WorkerGlobals;

const runWorker = async (modulePath: string, data: unknown) => {
  const posted: unknown[] = [];

  workerGlobals.onmessage = undefined;
  workerGlobals.postMessage = message => {
    posted.push(message);
  };

  await import(modulePath);
  await workerGlobals.onmessage!({ data });

  return posted;
};

const WORKERS = [
  {
    name: 'create-password-worker',
    path: './create-password-worker',
    data: { password: 'p', vault: { accounts: [] } },
    breakIt: () =>
      jest
        .requireMock('@libs/crypto/hashing')
        .encodePassword.mockRejectedValueOnce(
          new Error('encodePassword failed!')
        )
  },
  {
    name: 'unlock-vault-worker',
    path: './unlock-vault-worker',
    data: { password: 'p', keyDerivationSaltHash: 'salt', vaultCipher: 'c' },
    breakIt: () =>
      jest
        .requireMock('@libs/crypto/vault')
        .decryptVault.mockRejectedValueOnce(new Error('bad tag'))
  },
  {
    name: 'verify-password-worker',
    path: './verify-password-worker',
    data: { passwordHash: 'h', passwordSaltHash: 's', password: 'p' },
    breakIt: () =>
      jest
        .requireMock('@libs/crypto/hashing')
        .verifyPasswordAgainstHash.mockRejectedValueOnce(new Error('boom'))
  }
];

describe.each(WORKERS)('$name', ({ path, data, breakIt }) => {
  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('posts a result on success', async () => {
    const posted = await runWorker(path, data);

    expect(posted).toHaveLength(1);
    expect(isWorkerError(posted[0])).toBe(false);
  });

  // a rejection inside an async onmessage raises no error event on the parent
  // Worker, so the only way the page can learn about it is this message
  it('posts an error message when the crypto layer rejects', async () => {
    breakIt();

    const posted = await runWorker(path, data);

    expect(posted).toEqual([{ error: true }]);
  });
});

describe('isWorkerError', () => {
  it.each([
    [{ error: true }, true],
    [{ error: false }, false],
    [{ isPasswordCorrect: true }, false],
    [null, false],
    [undefined, false],
    ['error', false]
  ])('%p -> %p', (data, expected) => {
    expect(isWorkerError(data)).toBe(expected);
  });
});
