import { CLValue, Deploy } from 'casper-js-sdk';

export type ArgDict = { [key: string]: string | CLValue };

export enum DeployType {
  TransferCall = 'Transfer Call',
  ContractCall = 'Contract Call',
  ModuleBytes = 'Module Bytes',
  Unknown = 'Unknown',
  AuctionNative = 'Auction Native'
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
  contractHash?: string;
  contractName?: string;
  txHash?: string;
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
  Json = 'json'
}

export interface ParsedDeployArgValue {
  parsedValue: string;
  type?: ParsedValueType;
}
