import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export type SecretPhrase = string[];

export function generateSecretPhrase(): SecretPhrase {
  const mnmemonic = bip39.generateMnemonic(wordlist, 256).split(' ');
  return mnmemonic;
}

export function secretPhraseToSeed(secretPhrase: SecretPhrase): Uint8Array {
  const entropy = bip39.mnemonicToSeedSync(secretPhrase.join(' '));
  return entropy;
}

export function encodeSeed(secretPhrase: SecretPhrase): Uint8Array {
  const entropy = bip39.mnemonicToEntropy(secretPhrase.join(' '), wordlist);
  return entropy;
}

export function decodeSeed(entropy: Uint8Array): SecretPhrase {
  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
  return mnemonic.split(' ');
}

export function validateSecretPhrase(
  secretPhrase: null | string[]
): secretPhrase is SecretPhrase {
  if (secretPhrase == null) {
    return false;
  }
  const mnemonic = secretPhrase.join(' ');
  return bip39.validateMnemonic(mnemonic, wordlist);
}
