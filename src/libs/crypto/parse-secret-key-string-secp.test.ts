import { Keys, decodeBase16 } from 'casper-js-sdk';

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
  let keyPair: Keys.AsymmetricKey;

  try {
    const secretKey = decodeBase16(secretKeyHex);
    const privateKeyBuffer = Keys.Secp256K1.parsePrivateKey(secretKey, 'raw');
    const publicKey = Keys.Secp256K1.privateToPublicKey(privateKeyBuffer);

    keyPair = Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');
  } catch (error) {
    console.error(error);
    throw Error('Invalid secret key');
  }

  return keyPair;
}
