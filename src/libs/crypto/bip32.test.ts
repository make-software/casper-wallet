import { deriveKeyPair } from './bip32';
import { FIXED_PUBLIC_KEY_0, FIXED_SECRET_PHRASE } from './__fixtures';

describe('bip32', () => {
  it('should derive the same key as ledger from the same mnomonic phrase', () => {
    const keyPair = deriveKeyPair(FIXED_SECRET_PHRASE, 0);
    expect(keyPair.publicKey).toBe(FIXED_PUBLIC_KEY_0);
  });
});
