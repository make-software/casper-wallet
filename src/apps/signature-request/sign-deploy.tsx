import { CLPublicKey, decodeBase16, CLPublicKeyTag } from 'casper-js-sdk';
import { AsymmetricKey, Ed25519, Secp256K1 } from 'casper-js-sdk/dist/lib/Keys';

export const signDeploy = (
  deployHash: Uint8Array,
  publicKeyHex: string,
  privateKeyHex: string
) => {
  const clPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const publicKey = clPublicKey.value();
  const secretKey = decodeBase16(privateKeyHex);

  let signingKey: AsymmetricKey;
  switch (clPublicKey.tag) {
    case CLPublicKeyTag.ED25519:
      signingKey = new Ed25519({ publicKey, secretKey });
      break;

    case CLPublicKeyTag.SECP256K1:
      signingKey = new Secp256K1(publicKey, secretKey);
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
};
