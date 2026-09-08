import { concatBytes } from '@noble/ciphers/utils.js';
import {
  Conversions,
  KeyAlgorithm,
  PrivateKey,
  Transaction
} from 'casper-js-sdk';
import {
  buildCsprTransferTransactions,
  createPrivateKeySigner
} from 'casper-wallet-core';

import { toProviderSignatureHex } from '@libs/crypto/provider-signature';

const signTransfer = async (algorithm: KeyAlgorithm) => {
  const privateKey = PrivateKey.generate(algorithm);
  const { fallbackDeploy } = buildCsprTransferTransactions(
    {
      network: 'testnet',
      transferAmountMotes: '1000000000',
      memo: '34',
      senderPublicKeyHex: privateKey.publicKey.toHex(),
      recipientPublicKeyHex: PrivateKey.generate(
        KeyAlgorithm.ED25519
      ).publicKey.toHex()
    },
    '1.5.8'
  );
  const transaction = Transaction.fromDeploy(fallbackDeploy);
  const signer = createPrivateKeySigner({
    publicKeyHex: privateKey.publicKey.toHex(),
    secretKeyBase64: Conversions.encodeBase64(privateKey.toBytes())
  });

  return {
    privateKey,
    transaction,
    response: await signer.signTransaction(transaction)
  };
};

const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('toProviderSignatureHex', () => {
  it.each([
    ['Ed25519', KeyAlgorithm.ED25519],
    ['Secp256K1', KeyAlgorithm.SECP256K1]
  ])(
    'returns the raw signature, not the algorithm-prefixed one (%s)',
    async (_name, algorithm) => {
      const { response } = await signTransfer(algorithm);

      expect(toProviderSignatureHex(response)).toBe(toHex(response.signature));
      expect(toProviderSignatureHex(response)).not.toBe(
        toHex(response.signatureWithPrefix)
      );
    }
  );

  it('returns hex a dapp can verify against the signed transaction hash', async () => {
    const { privateKey, transaction, response } = await signTransfer(
      KeyAlgorithm.ED25519
    );
    const signatureHex = toProviderSignatureHex(response);
    const algBytes = Uint8Array.of(privateKey.publicKey.cryptoAlg);

    expect(
      privateKey.publicKey.verifySignature(
        transaction.hash.toBytes(),
        concatBytes(algBytes, Buffer.from(signatureHex, 'hex'))
      )
    ).toBeTruthy();
  });
});
