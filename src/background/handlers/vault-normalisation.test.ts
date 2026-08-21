import { VaultState } from '@background/redux/vault/types';

import { normaliseDecryptedVault } from './vault-normalisation';

const vaultWith = (
  accounts: unknown[],
  vaultFields: Record<string, unknown> = {}
) => ({ accounts, ...vaultFields }) as unknown as VaultState;

it('lower-cases every public key when any account has a checksummed one', () => {
  const result = normaliseDecryptedVault(
    vaultWith([
      { name: 'a', publicKey: '01AbC', hidden: false },
      { name: 'b', publicKey: '02DEF', hidden: false }
    ])
  );

  expect(result.accounts.map(a => a.publicKey)).toEqual(['01abc', '02def']);
});

it('leaves public keys alone when none is checksummed', () => {
  const result = normaliseDecryptedVault(
    vaultWith([{ name: 'a', publicKey: '01abc', hidden: false }])
  );

  expect(result.accounts[0].publicKey).toBe('01abc');
});

it('fills a missing hidden flag with false', () => {
  const result = normaliseDecryptedVault(
    vaultWith([{ name: 'a', publicKey: '01abc' }])
  );

  expect(result.accounts[0].hidden).toBe(false);
});

it('preserves an explicit hidden: true', () => {
  const result = normaliseDecryptedVault(
    vaultWith([{ name: 'a', publicKey: '01abc', hidden: true }])
  );

  expect(result.accounts[0].hidden).toBe(true);
});

it('handles empty accounts array', () => {
  const result = normaliseDecryptedVault(vaultWith([]));

  expect(result.accounts).toEqual([]);
});

it('preserves account and vault-level fields', () => {
  const result = normaliseDecryptedVault(
    vaultWith(
      [
        {
          name: 'test-account',
          publicKey: '01AbC',
          hidden: false,
          secretKey: 'secret-key-data',
          derivationIndex: 5
        }
      ],
      {
        secretPhrase: 'test-phrase',
        activeAccountName: 'test-account',
        otherField: 'preserved'
      }
    )
  );

  expect(result.accounts[0]).toMatchObject({
    name: 'test-account',
    secretKey: 'secret-key-data',
    derivationIndex: 5,
    hidden: false,
    publicKey: '01abc'
  });
  expect(result).toMatchObject({
    secretPhrase: 'test-phrase',
    activeAccountName: 'test-account',
    otherField: 'preserved'
  });
});
