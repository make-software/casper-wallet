import { Deploy } from 'casper-js-sdk/dist/lib/DeployUtil';

export type ArgDict = { [key: string]: string | string[] };
export type DeployType = 'Transfer Call' | 'Contract Call';

export enum DeployTypeEnum {
  TransferCall = 'Transfer Call',
  ContractCall = 'Contract Call'
}

export type SignatureRequest = {
  signingKey: string;
  account: string;
  deployHash: string;
  timestamp: string;
  transactionFee: string;
  chainName: string;
  deployType: DeployType;
};

export type DeployArguments = {
  delegator?: string;
  validator?: string;
  newValidator?: string;
  amount?: string;
  recipient?: string;
  transferId?: string;
  entryPoint?: string;
  recipientKey?: string;
  recipientHash?: string;
};

export const isKeyOfHashValue = (key: string) => {
  const keysOfHashValues: (keyof SignatureRequest | keyof DeployArguments)[] = [
    'signingKey',
    'account',
    'deployHash',
    'delegator',
    'validator',
    'newValidator',
    'recipient',
    'recipientKey',
    'recipientHash'
  ];
  return keysOfHashValues.includes(
    key as keyof SignatureRequest | keyof DeployArguments
  );
};

export const isKeyOfPriceValue = (key: string) => {
  const keysOfPriceValues: (keyof SignatureRequest | keyof DeployArguments)[] =
    ['amount', 'transferId', 'transactionFee'];

  return keysOfPriceValues.includes(
    key as keyof SignatureRequest | keyof DeployArguments
  );
};

export const isKeyOfTimestampValue = (key: string) => {
  const keysOfTimestampValues: (
    | keyof SignatureRequest
    | keyof DeployArguments
  )[] = ['timestamp'];

  return keysOfTimestampValues.includes(
    key as keyof SignatureRequest | keyof DeployArguments
  );
};

export type CasperDeploy = Deploy;
