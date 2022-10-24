import { deriveKeyPair } from './bip32';
import { EXPECTED_PUBLIC_KEY_0, SECRET_PHRASE } from './ledger-casper-fixtures';

describe('bip32', () => {
  it('should derive the same key as ledger from the same mnomonic phrase', () => {
    const keyPair = deriveKeyPair(SECRET_PHRASE, 0);
    expect(keyPair.publicKey).toBe(EXPECTED_PUBLIC_KEY_0);
  });
});
