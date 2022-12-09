import { Deploy } from 'casper-js-sdk/dist/lib/DeployUtil';

export type ArgDict = { [key: string]: string | string[] };

export enum DeployType {
  TransferCall = 'Transfer Call',
  ContractCall = 'Contract Call',
  Unknown = 'Unknown'
}

export type SignatureRequestFields = {
  signingKey: string;
  account: string;
  deployHash: string;
  timestamp: string;
  transactionFee: string;
  chainName: string;
  deployType: DeployType;
};

export type SignatureRequestArguments = {
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

export type SignatureRequestKeys =
  | keyof SignatureRequestFields
  | keyof SignatureRequestArguments;

export const isKeyOfHashValue = (key: string) => {
  const keysOfHashValues: SignatureRequestKeys[] = [
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
  return keysOfHashValues.includes(key as SignatureRequestKeys);
};

export const isKeyOfCurrencyValue = (key: string) => {
  const keysOfPriceValues: SignatureRequestKeys[] = [
    'amount',
    'transactionFee'
  ];

  return keysOfPriceValues.includes(key as SignatureRequestKeys);
};

export const isKeyOfTimestampValue = (key: string) => {
  const keysOfTimestampValues: SignatureRequestKeys[] = ['timestamp'];
  return keysOfTimestampValues.includes(key as SignatureRequestKeys);
};

export type CasperDeploy = Deploy;
