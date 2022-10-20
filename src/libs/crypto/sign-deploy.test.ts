import { Keys } from 'casper-js-sdk';
import { signDeploy } from './sign-deploy';

const getSignature = (keyPair: Keys.Ed25519 | Keys.Secp256K1) => {
  const pk = keyPair.publicKey.toHex();
  const sk = Buffer.from(keyPair.privateKey).toString('base64');
  return signDeploy(hash, pk, sk);
};

const hash = Buffer.from(
  'cffc63f9c514bfc78c53852705f556b8a4fd5bfd6e073a66952ece942bdf19e0',
  'hex'
);

it('should get correct signature for Ed25519 keyPair', () => {
  const keyPair = Keys.Ed25519.new();
  const signature = getSignature(keyPair);
  expect(keyPair.verify(signature, hash)).toBeTruthy();
});

it('should get correct signature for Secp256K1 keyPair', () => {
  const keyPair = Keys.Secp256K1.new();
  const signature = getSignature(keyPair);
  expect(keyPair.verify(signature, hash)).toBeTruthy();
});
