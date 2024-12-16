import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';
import fs from 'fs';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

import { parseSecretKeyString } from './parse-secret-key-string';

/** manual testing should confirm that imported keys have the same public key and private key than legacy signer */

it('should import ed key pair from the pem file, validate keys and generate the same file from this key pair', async () => {
  const ed = {
    type: 'ed',
    pemFilePath: __dirname + '/ed_secret_key.pem',
    pemFilePublicKeyHex:
      '01c8988c6ceac0013824432d5ee68e4292975361b8acc55fc0ddcdae19f062f3db'
  } as const;

  await expect(getData(ed.type, ed.pemFilePath)).resolves.toStrictEqual({
    publicKeyHex: ed.pemFilePublicKeyHex,
    publicKey: ed.pemFilePublicKeyHex,
    pemFileContents: `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIKu6biwimq52O4qzdyAp78RrIblNs6GXZdkcqr0+iLLj
-----END PRIVATE KEY-----
`
  });
});

it('should import secp key pair from the pem file, validate keys and generate the same file from this key pair', async () => {
  const secp = {
    type: 'secp',
    pemFilePath: __dirname + '/secp_secret_key.pem',
    pemFilePublicKeyHex:
      '0202963c77ed0dcf1cc098ce9355aa71c2b74edc96645a8e1ce2882980e9881c73e5'
  } as const;

  await expect(getData(secp.type, secp.pemFilePath)).resolves.toStrictEqual({
    publicKeyHex: secp.pemFilePublicKeyHex,
    publicKey: secp.pemFilePublicKeyHex,
    pemFileContents: `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIF9N7aGLID1DPkpayubhr4t0YuRbX+ppcwSXIIIKP33joAcGBSuBBAAK
oUQDQgAEljx37Q3PHMCYzpNVqnHCt07clmRajhziiCmA6Ygcc+W+rKMDv4vXDJ21
u7aZawhRbZl0Ilnrz9MVHbhiSeva0g==
-----END EC PRIVATE KEY-----`
  });
});

const getData = async (type: 'ed' | 'secp', pemFilePath: string) => {
  const pemFileContents = fs.readFileSync(pemFilePath).toString();

  const { publicKeyHex, secretKeyBase64 } =
    await parseSecretKeyString(pemFileContents);

  const keyPair = await getKeyPairFromSecretKeyBase64(type, secretKeyBase64);

  return {
    publicKeyHex,
    publicKey: keyPair.publicKey.toHex(),
    pemFileContents
  };
};

async function getKeyPairFromSecretKeyBase64(
  asymmetricKey: 'ed' | 'secp',
  secretKeyBase64: string
) {
  let keyPair: AsymmetricKeys;

  switch (asymmetricKey) {
    case 'ed':
      {
        const secretKey = Conversions.base64to16(secretKeyBase64);
        const privateKey = await PrivateKey.fromHex(
          secretKey,
          KeyAlgorithm.ED25519
        );
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
        const privateKey = await PrivateKey.fromHex(
          secretKey,
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
