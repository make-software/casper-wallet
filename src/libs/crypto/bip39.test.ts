import {
  encodeEntropy,
  decodeEntropy,
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
    const entropy = encodeEntropy(originalMnemonic);
    const mnemonic = decodeEntropy(entropy);
    expect(mnemonic).toStrictEqual(originalMnemonic);
  });
});
