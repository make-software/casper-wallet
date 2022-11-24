import { aesDecryptString, aesEncryptString } from './aes';
import { SecretPhrase } from './bip39';

const SECRET_PHRASE_SEPARATOR = ' ';

export function encryptSecretPhrase(
  encryptionKeyHash: string | null,
  secretPhrase: SecretPhrase
): Promise<string> {
  if (encryptionKeyHash == null) {
    throw Error("Encryption key doesn't exist");
  }

  return aesEncryptString(
    encryptionKeyHash,
    secretPhrase.join(SECRET_PHRASE_SEPARATOR)
  );
}

export function decryptSecretPhrase(
  encryptionKeyHash: string | null,
  secretPhraseCipher: string | null
): Promise<SecretPhrase> {
  if (encryptionKeyHash == null) {
    throw Error("Encryption key doesn't exist");
  }
  if (secretPhraseCipher == null) {
    throw Error("Secret Phrase Cipher doesn't exist");
  }

  return aesDecryptString(encryptionKeyHash, secretPhraseCipher).then(val =>
    val.split(SECRET_PHRASE_SEPARATOR)
  );
}
