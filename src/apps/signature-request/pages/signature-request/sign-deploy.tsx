import { CLPublicKey, CLPublicKeyTag, Keys, decodeBase64 } from 'casper-js-sdk';

export const signDeploy = (
  deployHash: Uint8Array,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const clPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const publicKey = clPublicKey.value();
  const secretKey = decodeBase64(privateKeyBase64);
  console.log('SIGN', publicKeyHex, privateKeyBase64);

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

const pk = '01f9631111f51219ac0b96ce69ffd9f8fc274a744a8e3e77cd7b18f8b5d4bcf39a';
const sk = '0Z4EkL1TStnELE1QL2IgtjiOem3mjMp4WHOX91Er6Lc=';
const hash = Buffer.from(
  'cffc63f9c514bfc78c53852705f556b8a4fd5bfd6e073a66952ece942bdf19e0',
  'hex'
);

const res = signDeploy(hash, pk, sk);
console.log(res);
