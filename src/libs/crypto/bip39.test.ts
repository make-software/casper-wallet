import {
  decodeSeed,
  encodeSeed,
  generateSecretPhrase,
  validateSecretPhrase
} from './bip39';

describe('bip39', () => {
  const originalMnemonic = generateSecretPhrase();

  it('should generate valid mnemonic', () => {
    expect(validateSecretPhrase(originalMnemonic)).toBeTruthy();
    expect(originalMnemonic).toHaveLength(24);
  });

  it('should encode and decode entropy correctly', () => {
    const entropy = encodeSeed(originalMnemonic);
    const mnemonic = decodeSeed(entropy);
    expect(mnemonic).toStrictEqual(originalMnemonic);
  });
});
