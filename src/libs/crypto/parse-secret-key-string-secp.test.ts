import { KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

import { AsymmetricKeys } from './create-asymmetric-key';

describe('parseSecretKeyStringSecp', () => {
  it('should throws an error for an invalid secret key', () => {
    expect(() => {
      parseSecretKeyStringSecp('invalidKey');
    }).toThrowError('Invalid secret key');
  });

  it('should returns the correct key pair for a valid secret key', () => {
    const keyPair = parseSecretKeyStringSecp(
      '0f7e7bb1cfd213fd70b4fb60079c15f4588bfe2c6451d22964056e0d10cbd607'
    );

    expect(keyPair.publicKey.toHex(false)).toBe(
      '0202cc6aae3d7687a429ff32989c4bd712ffd29280f4205abbc9a1c8623ef401b93b'
    );
  });
});

function parseSecretKeyStringSecp(secretKeyHex: string) {
  let keyPair: AsymmetricKeys;

  try {
    const privateKey = PrivateKey.fromHex(
      getPrivateKeyHexFromSecretKey(secretKeyHex),
      KeyAlgorithm.SECP256K1
    );

    const publicKey = privateKey.publicKey;

    keyPair = {
      secretKey: privateKey,
      publicKey
    };
  } catch (error) {
    throw Error('Invalid secret key');
  }

  return keyPair;
}
