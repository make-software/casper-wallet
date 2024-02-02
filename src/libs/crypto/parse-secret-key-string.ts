import ASN1 from '@lapo/asn1js';
import Base64 from '@lapo/asn1js/base64';
import { Keys, decodeBase16 } from 'casper-js-sdk';
// These libraries are required for backward compatibility with Legacy Signer
import { t } from 'i18next';

import { privateKeyBytesToBase64 } from './utils';

export function parseSecretKeyString(fileContents: string): {
  publicKeyHex: string;
  secretKeyBase64: string;
} {
  const der = Base64.unarmor(fileContents);
  const decodedString = ASN1.decode(der).toPrettyString();
  const algorithm = getAlgorithm(decodedString);

  let keyPair: Keys.AsymmetricKey;
  switch (algorithm) {
    case 'Ed25519':
      {
        const secretKeyHex = decodedString.split('\n')[4].split('|')[1];
        const secretKey = decodeBase16(secretKeyHex);
        const privateKeyBuffer = Keys.Ed25519.parsePrivateKey(secretKey);
        const publicKey = Keys.Ed25519.privateToPublicKey(privateKeyBuffer);

        keyPair = Keys.Ed25519.parseKeyPair(publicKey, secretKey);
      }
      break;

    case 'Secp256K1':
      {
        const secretKeyHex = decodedString.split('\n')[2].split('|')[1];
        const secretKey = decodeBase16(secretKeyHex);
        const privateKeyBuffer = Keys.Secp256K1.parsePrivateKey(
          secretKey,
          'raw'
        );
        const publicKey = Keys.Secp256K1.privateToPublicKey(privateKeyBuffer);

        keyPair = Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');
      }
      break;

    default:
      throw Error(
        t('A private key was not detected. Try importing a different file.')
      );
  }

  return {
    secretKeyBase64: privateKeyBytesToBase64(keyPair.privateKey),
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
