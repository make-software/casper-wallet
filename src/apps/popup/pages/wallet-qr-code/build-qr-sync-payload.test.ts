import {
  fetchAccountSecretKeys,
  fetchSecretPhrase
} from '@background/handlers/vault-secrets';

import { Account } from '@libs/types/account';

import { buildQrSyncPayload } from './build-qr-sync-payload';

jest.mock('@background/handlers/vault-secrets', () => ({
  fetchSecretPhrase: jest.fn(),
  fetchAccountSecretKeys: jest.fn()
}));

// Pass-through: this suite drives the rejection paths, and the real retry loop
// would spend ~750ms of wall clock per rejection test.
jest.mock('@libs/messaging/request-with-retry', () => ({
  requestWithRetry: jest.fn((send: () => Promise<unknown>) => send())
}));

const mockFetchPhrase = fetchSecretPhrase as jest.Mock;
const mockFetchSecretKeys = fetchAccountSecretKeys as jest.Mock;

const PHRASE = ['abandon', 'ability'];

// Replica copies: `secretKey` is always blanked, `watching` is what the
// broadcast sanitizer derived.
const imported = (name: string, watching = false): Account =>
  ({
    name,
    publicKey: `01${name}`,
    secretKey: '',
    imported: true,
    watching,
    hidden: false
  }) as Account;

const derived = (name: string): Account =>
  ({ name, publicKey: `02${name}`, secretKey: '', hidden: false }) as Account;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchPhrase.mockResolvedValue(PHRASE);
  mockFetchSecretKeys.mockResolvedValue({
    alice: 'sk-alice',
    bob: 'sk-bob'
  });
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('assembles the payload and requests imported names only', async () => {
  const payload = await buildQrSyncPayload(
    [derived('Account 1')],
    [imported('alice'), imported('bob')]
  );

  expect(mockFetchSecretKeys).toHaveBeenCalledWith(['alice', 'bob']);
  expect(payload).toEqual({
    secretPhrase: PHRASE,
    derivedAccounts: [
      { name: 'Account 1', publicKey: '02Account 1', secretKey: '' }
    ],
    importedAccounts: [
      { name: 'alice', publicKey: '01alice', secretKey: 'sk-alice' },
      { name: 'bob', publicKey: '01bob', secretKey: 'sk-bob' }
    ]
  });
});

// The mobile client re-derives derived accounts from the phrase, so their keys
// must never ride along even if the map happens to carry the name.
it('never takes a derived account key from the map', async () => {
  mockFetchSecretKeys.mockResolvedValue({ 'Account 1': 'sk-derived' });

  const payload = await buildQrSyncPayload([derived('Account 1')], []);

  expect(payload?.derivedAccounts).toEqual([
    { name: 'Account 1', publicKey: '02Account 1', secretKey: '' }
  ]);
});

it('refuses without requesting keys when the phrase is refused', async () => {
  mockFetchPhrase.mockResolvedValue(null);

  expect(await buildQrSyncPayload([], [imported('alice')])).toBeNull();
  expect(mockFetchSecretKeys).not.toHaveBeenCalled();
});

it('refuses when the phrase request rejects', async () => {
  mockFetchPhrase.mockRejectedValue(new Error('transport'));

  expect(await buildQrSyncPayload([], [imported('alice')])).toBeNull();
});

it('refuses when the keys request is refused', async () => {
  mockFetchSecretKeys.mockResolvedValue(null);

  expect(await buildQrSyncPayload([], [imported('alice')])).toBeNull();
});

it('refuses when the keys request rejects', async () => {
  mockFetchSecretKeys.mockRejectedValue(new Error('transport'));

  expect(await buildQrSyncPayload([], [imported('alice')])).toBeNull();
});

// An all-watch-only wallet legitimately produces an empty map: those accounts
// hold no key to sync, and `''` is the same payload they had before the vault
// secrets moved off the broadcast.
it('syncs an all-watch-only wallet from an empty map', async () => {
  mockFetchSecretKeys.mockResolvedValue({});

  const payload = await buildQrSyncPayload(
    [],
    [imported('watch-1', true), imported('watch-2', true)]
  );

  expect(payload?.importedAccounts).toEqual([
    { name: 'watch-1', publicKey: '01watch-1', secretKey: '' },
    { name: 'watch-2', publicKey: '01watch-2', secretKey: '' }
  ]);
});

// The rename/removal race: the account holds a key, the map came back without
// it, and syncing it keyless would look like success on both ends.
it('refuses when a non-watching imported account is missing from the map', async () => {
  mockFetchSecretKeys.mockResolvedValue({});

  const payload = await buildQrSyncPayload(
    [],
    [imported('alice'), imported('watch', true)]
  );

  expect(payload).toBeNull();
});

it('treats an empty key in the map as missing', async () => {
  mockFetchSecretKeys.mockResolvedValue({ alice: '' });

  expect(await buildQrSyncPayload([], [imported('alice')])).toBeNull();
});

it('keeps watch-only accounts keyless alongside key-bearing ones', async () => {
  mockFetchSecretKeys.mockResolvedValue({ alice: 'sk-alice' });

  const payload = await buildQrSyncPayload(
    [],
    [imported('alice'), imported('watch', true)]
  );

  expect(payload?.importedAccounts).toEqual([
    { name: 'alice', publicKey: '01alice', secretKey: 'sk-alice' },
    { name: 'watch', publicKey: '01watch', secretKey: '' }
  ]);
});

it('never names the account it could not find a key for', async () => {
  mockFetchSecretKeys.mockResolvedValue({});

  await buildQrSyncPayload([], [imported('alice')]);

  const logged = (console.error as jest.Mock).mock.calls;
  expect(JSON.stringify(logged)).not.toContain('alice');
  expect(logged[0]).toContain(1);
});
