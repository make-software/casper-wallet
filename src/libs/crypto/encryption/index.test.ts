import {
  decryptEncryptedBase64PrivateKey,
  encryptAsHexWithCasperPublicKey
} from './index';

// Generated once from this implementation. They exist so a library swap that
// silently changes the wire format fails here instead of in the field — a
// round-trip alone would stay green through such a change.
const ED_PUBLIC =
  '0179b5562e8fe654f94078b112e8a98ba7901f853ae695bed7e0e3910bad049664';
const ED_SECRET_B64 = 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=';
const ED_CIPHER =
  '9268b77309f6c1a0121ced326c200db158075f786ab8d7f53e4f8dd456113e3ccd21d447c71be714e14aa2b215b79e1a3c3a0e0ab0618a68884707ec61cdfe6046a3';

const SECP_PUBLIC =
  '0202cc6aae3d7687a429ff32989c4bd712ffd29280f4205abbc9a1c8623ef401b93b';
const SECP_SECRET_B64 = 'D357sc/SE/1wtPtgB5wV9FiL/ixkUdIpZAVuDRDL1gc=';
const SECP_CIPHER =
  '01002102666768be2ca7e3c25a38387ac46618c22eaa12faceb366e834cacfdb20132ca8f6cf92e1d3a03d6a60b560944c0d2e3b3f7785755eac2187f3bcb8da3c3742e302313f0fd6278022ba56d61459856c020d38982b06802d36e0e55e1338dc';

const MESSAGE = 'wallet-1364 vector';

describe('ECIES round trip', () => {
  it('encrypts to an ED25519 key and decrypts back', async () => {
    const cipher = await encryptAsHexWithCasperPublicKey(ED_PUBLIC, MESSAGE);

    await expect(
      decryptEncryptedBase64PrivateKey(cipher, ED_PUBLIC, ED_SECRET_B64)
    ).resolves.toBe(MESSAGE);
  });

  it('encrypts to a SECP256K1 key and decrypts back', async () => {
    const cipher = await encryptAsHexWithCasperPublicKey(SECP_PUBLIC, MESSAGE);

    await expect(
      decryptEncryptedBase64PrivateKey(cipher, SECP_PUBLIC, SECP_SECRET_B64)
    ).resolves.toBe(MESSAGE);
  });

  it('produces a fresh ciphertext each time (ephemeral sender key)', async () => {
    const a = await encryptAsHexWithCasperPublicKey(ED_PUBLIC, MESSAGE);
    const b = await encryptAsHexWithCasperPublicKey(ED_PUBLIC, MESSAGE);

    expect(a).not.toBe(b);
  });
});

describe('ECIES fixed vectors', () => {
  it('decrypts a pinned ED25519 ciphertext', async () => {
    await expect(
      decryptEncryptedBase64PrivateKey(ED_CIPHER, ED_PUBLIC, ED_SECRET_B64)
    ).resolves.toBe(MESSAGE);
  });

  it('decrypts a pinned SECP256K1 ciphertext', async () => {
    await expect(
      decryptEncryptedBase64PrivateKey(
        SECP_CIPHER,
        SECP_PUBLIC,
        SECP_SECRET_B64
      )
    ).resolves.toBe(MESSAGE);
  });
});

describe('key-type dispatch', () => {
  it('rejects a public key that is neither 32 nor 33 bytes', async () => {
    await expect(
      encryptAsHexWithCasperPublicKey('01' + 'ab'.repeat(20), MESSAGE)
    ).rejects.toThrow('Unknown public key type');
  });

  it('rejects a tampered ciphertext', async () => {
    const cipher = await encryptAsHexWithCasperPublicKey(ED_PUBLIC, MESSAGE);
    const tampered =
      cipher.slice(0, -2) + (cipher.endsWith('00') ? '11' : '00');

    await expect(
      decryptEncryptedBase64PrivateKey(tampered, ED_PUBLIC, ED_SECRET_B64)
    ).rejects.toThrow();
  });
});
