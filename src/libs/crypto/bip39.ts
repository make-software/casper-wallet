import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export type SecretPhrase = string[];

export function generateSecretPhrase(): SecretPhrase {
  const mnmemonic = bip39.generateMnemonic(wordlist, 256).split(' ');
  return mnmemonic;
}

export function encodeEntropy(mnemonic: SecretPhrase): Uint8Array {
  const entropy = bip39.mnemonicToEntropy(mnemonic.join(' '), wordlist);
  return entropy;
}

export function decodeEntropy(entropy: Uint8Array): SecretPhrase {
  const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);
  return mnemonic.split(' ');
}

export function validateSecretPhrase(mnemonic: SecretPhrase): boolean {
  return bip39.validateMnemonic(mnemonic.join(' '), wordlist);
}
