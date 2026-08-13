import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { AccountListRows } from '@libs/types/account';

import { runKeysDownload } from './run-keys-download';
import { DownloadAccountKeysSteps, downloadFile } from './utils';

const zipFile = jest.fn();
const generateAsync = jest.fn();

jest.mock('jszip', () =>
  jest.fn().mockImplementation(() => ({
    file: zipFile,
    generateAsync: generateAsync
  }))
);

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  downloadFile: jest.fn()
}));

jest.mock('@libs/crypto/create-asymmetric-key', () => ({
  createAsymmetricKeys: jest.fn()
}));

const mockCreateKeys = createAsymmetricKeys as jest.Mock;
const mockDownloadFile = downloadFile as jest.Mock;

const account = (name: string): AccountListRows =>
  ({
    name,
    publicKey: `01${name}`,
    secretKey: `sk-${name}`
  }) as AccountListRows;

beforeEach(() => {
  jest.clearAllMocks();
  generateAsync.mockResolvedValue(new Uint8Array([1, 2, 3]));
  mockCreateKeys.mockImplementation(() => ({
    secretKey: { toPem: () => 'PEM' }
  }));
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('writes one pem per account and reports Success', async () => {
  const setStep = jest.fn();

  await runKeysDownload([account('alice'), account('bob')], setStep);

  expect(zipFile).toHaveBeenCalledTimes(2);
  expect(zipFile).toHaveBeenCalledWith('alice_secret_key.pem', 'PEM');
  expect(mockDownloadFile).toHaveBeenCalledTimes(1);
  expect(mockDownloadFile.mock.calls[0][1]).toBe(
    'casper-wallet-secret_keys.zip'
  );
  expect(setStep).toHaveBeenCalledWith(DownloadAccountKeysSteps.Success);
});

// WALLET-1345: the user must never be told their keys were saved when the
// archive never got built.
it('routes a zip failure to Failure and never to Success', async () => {
  generateAsync.mockRejectedValue(new Error('boom'));
  const setStep = jest.fn();

  await runKeysDownload([account('alice')], setStep);

  expect(setStep).toHaveBeenCalledWith(DownloadAccountKeysSteps.Failure);
  expect(setStep).not.toHaveBeenCalledWith(DownloadAccountKeysSteps.Success);
  expect(mockDownloadFile).not.toHaveBeenCalled();
});

// The thrown value is built from key material, so only the error NAME may reach
// the console.
it('logs the error name only, never the error itself', async () => {
  class SecretBearingError extends Error {
    name = 'PemEncodeError';
    message = 'secret key 0123456789abcdef';
  }
  generateAsync.mockRejectedValue(new SecretBearingError());
  const setStep = jest.fn();

  await runKeysDownload([account('alice')], setStep);

  const logged = (console.error as jest.Mock).mock.calls[0];
  expect(logged).toContain('PemEncodeError');
  expect(JSON.stringify(logged)).not.toContain('0123456789abcdef');
});
