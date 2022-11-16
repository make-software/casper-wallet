import { aesDecryptString, aesEncryptString } from './aes';
import { SecretPhrase } from './bip39';

export function encryptSecretPhrase(
  secretPhrase: SecretPhrase,
  password: string,
  encryptSaltHash: string
): Promise<string> {
  return aesEncryptString(password, encryptSaltHash, secretPhrase.join(''));
}

export function decryptSecretPhrase(
  secretPhraseCipher: string,
  password: string,
  encryptSaltHash: string
): Promise<SecretPhrase> {
  return aesDecryptString(password, encryptSaltHash, secretPhraseCipher).then(
    val => val.split(' ')
  );
}
