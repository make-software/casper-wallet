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
  token_metas?: string;
};

export type SignatureRequestKeys =
  | keyof SignatureRequestFields
  | keyof SignatureRequestArguments;

export type CasperDeploy = Deploy;

export enum ParsedValueType {
  json = 'json'
}

export interface ParsedDeployArgValue {
  parsedValue: string;
  type?: ParsedValueType;
}
