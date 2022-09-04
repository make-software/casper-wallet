import { Deploy } from 'casper-js-sdk/dist/lib/DeployUtil';

export type SignatureRequest = {
  signingKey: string;
  account: string;
  deployHash: string;
  timestamp: string;
  transactionFee: string;
  deployType: 'Transfer Call' | 'Contract Call';
};

export type DeployArguments = {
  delegator?: string;
  validator?: string;
  amount?: string;
  recipient?: string;
  transferId?: string;
  entryPoint?: string;
};

export const isKeyOfHashValue = (key: string) => {
  const keysOfHashValues: (keyof SignatureRequest | keyof DeployArguments)[] = [
    'signingKey',
    'account',
    'deployHash',
    'transactionFee',
    'delegator',
    'validator',
    'amount',
    'recipient',
    'transferId'
  ];
  return keysOfHashValues.includes(
    key as keyof SignatureRequest | keyof DeployArguments
  );
};

export type CasperDeploy = Deploy;
