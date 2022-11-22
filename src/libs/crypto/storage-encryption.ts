import { aesDecryptString, aesEncryptString } from './aes';
import { SecretPhrase } from './bip39';

export function encryptSecretPhrase(
  secretPhrase: SecretPhrase,
  password: string,
  keyDerivationSaltHash: string
): Promise<string> {
  return aesEncryptString(
    password,
    keyDerivationSaltHash,
    secretPhrase.join('')
  );
}

export function decryptSecretPhrase(
  secretPhraseCipher: string,
  password: string,
  keyDerivationSaltHash: string
): Promise<SecretPhrase> {
  return aesDecryptString(
    password,
    keyDerivationSaltHash,
    secretPhraseCipher
  ).then(val => val.split(' '));
}
