import { CLValue } from 'casper-js-sdk';
import { Deploy } from 'casper-js-sdk/dist/lib/DeployUtil';

export type ArgDict = { [key: string]: string | CLValue };

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
  entryPoint?: string;
};

export type SignatureRequestArguments = {
  delegator?: string;
  validator?: string;
  new_validator?: string;
  amount?: string;
  recipient?: string;
  transferId?: string;
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
    'new_validator',
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
