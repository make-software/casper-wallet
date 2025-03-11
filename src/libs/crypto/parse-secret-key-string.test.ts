import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';
import fs from 'fs';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

import { parseSecretKeyString } from './parse-secret-key-string';

/** manual testing should confirm that imported keys have the same public key and private key than legacy signer */

it('should import key pair from the pem file, validate keys and generate the same file from this key pair', () => {
  (
    [
      {
        type: 'ed',
        pemFilePath: __dirname + '/ed_secret_key.pem',
        pemFilePublicKeyHex:
          '01c8988c6ceac0013824432d5ee68e4292975361b8acc55fc0ddcdae19f062f3db'
      },
      {
        type: 'secp',
        pemFilePath: __dirname + '/secp_secret_key.pem',
        pemFilePublicKeyHex:
          '0202963c77ed0dcf1cc098ce9355aa71c2b74edc96645a8e1ce2882980e9881c73e5'
      }
    ] as const
  ).forEach(({ type, pemFilePath, pemFilePublicKeyHex }) => {
    const pemFileContents = fs.readFileSync(pemFilePath).toString();
    const { publicKeyHex, secretKeyBase64 } =
      parseSecretKeyString(pemFileContents);

    const keyPair = getKeyPairFromSecretKeyBase64(type, secretKeyBase64);

    expect(keyPair.publicKey.toHex(false)).toBe(pemFilePublicKeyHex);
    expect(keyPair.publicKey.toHex(false)).toBe(publicKeyHex);
    expect(keyPair.secretKey!.toPem()).toBe(pemFileContents);
  });
});

function getKeyPairFromSecretKeyBase64(
  asymmetricKey: 'ed' | 'secp',
  secretKeyBase64: string
) {
  let keyPair: AsymmetricKeys;

  switch (asymmetricKey) {
    case 'ed':
      {
        const secretKey = Conversions.base64to16(secretKeyBase64);
        const privateKey = PrivateKey.fromHex(secretKey, KeyAlgorithm.ED25519);
        const publicKey = privateKey.publicKey;
        keyPair = {
          secretKey: privateKey,
          publicKey
        };
      }
      break;

    case 'secp':
      {
        const secretKey = Conversions.base64to16(secretKeyBase64);
        const privateKey = PrivateKey.fromHex(
          getPrivateKeyHexFromSecretKey(secretKey),
          KeyAlgorithm.SECP256K1
        );
        const publicKey = privateKey.publicKey;
        keyPair = {
          secretKey: privateKey,
          publicKey
        };
      }
      break;

    default:
      throw Error('Unknown asymmetricKey: ' + asymmetricKey);
  }

  return keyPair;
}
