import { decodeBase64, Keys } from 'casper-js-sdk';
import fs from 'fs';
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

    expect(keyPair.publicKey.toHex().toLowerCase()).toBe(pemFilePublicKeyHex);
    expect(keyPair.publicKey.toHex()).toBe(publicKeyHex);
    expect(keyPair.exportPrivateKeyInPem()).toBe(pemFileContents);
  });
});

function getKeyPairFromSecretKeyBase64(
  asymmetricKey: 'ed' | 'secp',
  secretKeyBase64: string
) {
  let keyPair: Keys.AsymmetricKey;

  switch (asymmetricKey) {
    case 'ed':
      {
        const secretKey = decodeBase64(secretKeyBase64);
        const parsedSecretKey = Keys.Ed25519.parsePrivateKey(secretKey);
        const publicKey = Keys.Ed25519.privateToPublicKey(parsedSecretKey);
        keyPair = Keys.Ed25519.parseKeyPair(publicKey, secretKey);
      }
      break;

    case 'secp':
      {
        const secretKey = decodeBase64(secretKeyBase64);
        const parsedSecretKey = Keys.Secp256K1.parsePrivateKey(
          secretKey,
          'raw'
        );
        const publicKey = Keys.Secp256K1.privateToPublicKey(parsedSecretKey);
        keyPair = Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');
      }
      break;

    default:
      throw Error('Unknown asymmetricKey: ' + asymmetricKey);
  }

  return keyPair;
}
