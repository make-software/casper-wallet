import ASN1 from '@lapo/asn1js';
import Base64 from '@lapo/asn1js/base64';
import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';
// These libraries are required for backward compatibility with Legacy Signer
import { t } from 'i18next';

import { AsymmetricKeys } from './create-asymmetric-key';

export function parseSecretKeyString(fileContents: string): {
  publicKeyHex: string;
  secretKeyBase64: string;
} {
  const der = Base64.unarmor(fileContents);
  const decodedString: string = ASN1.decode(der).toPrettyString();
  const algorithm = getAlgorithm(decodedString);

  let keyPair: AsymmetricKeys;
  switch (algorithm) {
    case 'Ed25519':
      {
        const privateKey = PrivateKey.fromPem(
          fileContents,
          KeyAlgorithm.ED25519
        );
        const publicKey = privateKey.publicKey;

        keyPair = { secretKey: privateKey, publicKey };
      }
      break;

    case 'Secp256K1':
      {
        const privateKey = PrivateKey.fromPem(
          fileContents,
          KeyAlgorithm.SECP256K1
        );
        const publicKey = privateKey.publicKey;

        keyPair = { secretKey: privateKey, publicKey };
      }
      break;

    default:
      throw Error(
        t('A private key was not detected. Try importing a different file.')
      );
  }

  if (!keyPair.secretKey) {
    throw new Error(
      t('A private key was not detected. Try importing a different file.')
    );
  }

  return {
    secretKeyBase64: Conversions.encodeBase64(keyPair.secretKey.toBytes()),
    publicKeyHex: keyPair.publicKey.toHex(false)
  };
}

function getAlgorithm(content: string): 'Ed25519' | 'Secp256K1' | undefined {
  if (content.includes('curveEd25519')) {
    return 'Ed25519';
  } else if (content.includes('secp256k1')) {
    return 'Secp256K1';
  }
  return undefined;
}
