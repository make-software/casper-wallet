import { CLPublicKey, CLPublicKeyTag, decodeBase64, Keys } from 'casper-js-sdk';

export const signDeploy = (
  deployHash: Uint8Array,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const clPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const publicKey = clPublicKey.value();
  const secretKey = decodeBase64(privateKeyBase64);

  let signingKey: Keys.AsymmetricKey;
  switch (clPublicKey.tag) {
    case CLPublicKeyTag.ED25519:
      signingKey = new Keys.Ed25519({ publicKey, secretKey });
      break;

    case CLPublicKeyTag.SECP256K1:
      signingKey = new Keys.Secp256K1(publicKey, secretKey);
      break;

    default:
      throw Error('Unknown Signature type.');
  }

  // signature is a signed deploy hash
  const signature = signingKey.sign(deployHash);

  // ERROR HANDLING
  if (signature == null) {
    throw Error('Signature is empty.');
  }

  return signature;
  // return new Uint8Array([]);
};
