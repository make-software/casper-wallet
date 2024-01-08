import { HDKey } from '@scure/bip32';

import { KeyPair } from '@background/redux/vault/types';

import { secretPhraseToSeed, validateSecretPhrase } from './bip39';
import { getBip44Path } from './bip44';
import { privateKeyBytesToBase64, publicKeyBytesToHex } from './utils';

export function deriveKeyPair(
  secretPhrase: null | string[],
  index: number
): KeyPair {
  if (!validateSecretPhrase(secretPhrase)) {
    throw Error('secret phrase is invalid');
  }
  const seed = secretPhraseToSeed(secretPhrase);
  const hdKey = HDKey.fromMasterSeed(seed);

  const path = getBip44Path(index);
  const secpKey = hdKey.derive(path);

  if (secpKey.publicKey == null || secpKey.privateKey == null) {
    throw Error('hdKey derivation failed');
  }

  const publicKey = publicKeyBytesToHex(secpKey.publicKey);
  const secretKey = privateKeyBytesToBase64(secpKey.privateKey);

  return {
    publicKey,
    secretKey
  };
}
