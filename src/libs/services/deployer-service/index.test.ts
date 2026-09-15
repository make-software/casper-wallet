import {
  Conversions,
  Deploy,
  KeyAlgorithm,
  PrivateKey,
  Transaction
} from 'casper-js-sdk';
import {
  KeyPairMismatchError,
  buildCsprTransferTransactions
} from 'casper-wallet-core';

import { log } from '@background/wallet-repositories';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { Account } from '@libs/types/account';

import { getDateForDeploy, sendSignedTx, signTx } from './index';

const mockGetStatus = jest.fn();
const mockPutTransaction = jest.fn();
const mockPutDeploy = jest.fn();
const mockSetReferrer = jest.fn();
const mockSetCustomHeaders = jest.fn();

// Mocked at the same seam core's own repository test uses: only the RPC transport is
// faked, so `getDateForDeploy` / `sendSignedTx` exercise the real repository logic.
jest.mock('casper-js-sdk', () => ({
  ...jest.requireActual('casper-js-sdk'),
  HttpHandler: class {
    setReferrer = mockSetReferrer;
    setCustomHeaders = mockSetCustomHeaders;
  },
  RpcClient: class {
    getStatus = mockGetStatus;
    putTransaction = mockPutTransaction;
    putDeploy = mockPutDeploy;
  }
}));

const NETWORK = 'testnet';

const generateKeyPairFixture = () => {
  const pk = PrivateKey.generate(KeyAlgorithm.ED25519);
  return {
    publicKeyHex: pk.publicKey.toHex(),
    secretKeyBase64: Conversions.encodeBase64(pk.toBytes())
  };
};

const accountFixture = (overrides: Partial<Account> = {}): Account => ({
  name: 'test-account',
  publicKey: '',
  secretKey: '',
  hidden: false,
  ...overrides
});

const transferDeployFixture = (senderPublicKeyHex?: string) =>
  buildCsprTransferTransactions(
    {
      network: 'testnet',
      senderPublicKeyHex:
        senderPublicKeyHex ?? generateKeyPairFixture().publicKeyHex,
      recipientPublicKeyHex: generateKeyPairFixture().publicKeyHex,
      transferAmountMotes: '2500000000',
      timestamp: '2026-01-01T00:00:00.000Z'
    },
    '1.5.8'
  ).fallbackDeploy;

const txFromDeployFixture = () =>
  Transaction.fromDeploy(transferDeployFixture());

const nodeStatus = (isoDate: string, apiVersion = '2.0.0') => ({
  apiVersion,
  lastProgress: { toDate: () => new Date(isoDate) }
});

describe('deployer-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:10:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDateForDeploy', () => {
    it('returns the node lastProgress when the node is reachable and ahead of local−2s', async () => {
      const nodeDate = '2026-01-01T00:09:59.500Z'; // later than local (00:10:00) − 2s
      mockGetStatus.mockResolvedValue(nodeStatus(nodeDate));

      const result = await getDateForDeploy(NETWORK);

      expect(result).toBe(new Date(nodeDate).toISOString());
    });

    it('falls back to local−2s and reports the failure when the node is unreachable', async () => {
      const reportErrorSpy = jest
        .spyOn(log, 'reportError')
        .mockImplementation(() => {});
      mockGetStatus.mockRejectedValue(new Error('network down'));

      const result = await getDateForDeploy(NETWORK);

      expect(result).toBe(new Date('2026-01-01T00:09:58.000Z').toISOString());
      expect(reportErrorSpy).toHaveBeenCalled();
    });
  });

  describe('sendSignedTx', () => {
    it('submits via putTransaction on a 2.x node and resolves with the transaction hash hex', async () => {
      mockPutTransaction.mockResolvedValue({
        transactionHash: { toHex: () => 'tx-hash-hex' }
      });
      const tx = txFromDeployFixture();

      const result = await sendSignedTx(tx, NETWORK, '2.0.0');

      expect(result).toBe('tx-hash-hex');
      expect(mockPutTransaction).toHaveBeenCalledWith(tx);
      expect(mockPutDeploy).not.toHaveBeenCalled();
    });

    it('submits via putDeploy on a 1.x node and resolves with the deploy hash hex', async () => {
      mockPutDeploy.mockResolvedValue({
        deployHash: { toHex: () => 'deploy-hash-hex' }
      });
      const tx = txFromDeployFixture();

      const result = await sendSignedTx(tx, NETWORK, '1.5.8');

      expect(result).toBe('deploy-hash-hex');
      expect(mockPutDeploy).toHaveBeenCalled();
      expect(mockPutTransaction).not.toHaveBeenCalled();
    });

    it('rejects when a 1.x node has no deploy form to submit', async () => {
      const tx = txFromDeployFixture();
      // A CSPR-transfer transaction always has a Deploy form; the "no deploy form" case only
      // arises for transaction kinds the legacy Deploy shape cannot represent, which this test
      // reproduces directly rather than reconstructing such a transaction from the SDK.
      tx.getDeploy = jest.fn().mockReturnValue(undefined);

      await expect(sendSignedTx(tx, NETWORK, '1.5.8')).rejects.toThrow();
      expect(mockPutDeploy).not.toHaveBeenCalled();
      expect(mockPutTransaction).not.toHaveBeenCalled();
    });
  });

  describe('signTx', () => {
    it('signs with a software key producing bytes identical to tx.sign(keys.secretKey)', async () => {
      const { publicKeyHex, secretKeyBase64 } = generateKeyPairFixture();
      const keys = createAsymmetricKeys(publicKeyHex, secretKeyBase64);
      // Empty on purpose: outside the background the redux account holds no secret material,
      // so a signer built from `account.secretKey` would sign with nothing.
      const account = accountFixture({
        publicKey: publicKeyHex,
        secretKey: ''
      });

      const deploy = transferDeployFixture(publicKeyHex);
      const txForCore = Transaction.fromDeploy(
        Deploy.fromJSON(Deploy.toJSON(deploy))
      );
      const txForDirectSign = Transaction.fromDeploy(
        Deploy.fromJSON(Deploy.toJSON(deploy))
      );

      const signedByCore = await signTx(txForCore, keys, account);
      txForDirectSign.sign(keys.secretKey as PrivateKey);

      expect(signedByCore.validate()).toBe(true);
      expect(signedByCore.approvals[0]?.signer.toHex()).toBe(publicKeyHex);
      expect(signedByCore.approvals[0]?.signature.toHex()).toBe(
        txForDirectSign.approvals[0]?.signature.toHex()
      );
    });

    it('rejects with KeyPairMismatchError for a mismatched pair and submits nothing', async () => {
      const { secretKeyBase64 } = generateKeyPairFixture();
      const { publicKeyHex: unrelatedPublicKeyHex } = generateKeyPairFixture();
      const keys = createAsymmetricKeys(unrelatedPublicKeyHex, secretKeyBase64);
      const account = accountFixture({
        publicKey: unrelatedPublicKeyHex,
        secretKey: ''
      });
      const tx = txFromDeployFixture();

      await expect(signTx(tx, keys, account)).rejects.toBeInstanceOf(
        KeyPairMismatchError
      );
      expect(mockPutTransaction).not.toHaveBeenCalled();
      expect(mockPutDeploy).not.toHaveBeenCalled();
    });

    it('throws "Missing secret key" for a watching account', async () => {
      const { publicKeyHex } = generateKeyPairFixture();
      const keys = createAsymmetricKeys(publicKeyHex, '');
      const account = accountFixture({
        publicKey: publicKeyHex,
        secretKey: ''
      });
      const tx = txFromDeployFixture();

      await expect(signTx(tx, keys, account)).rejects.toThrow(
        'Missing secret key'
      );
    });
  });
});
