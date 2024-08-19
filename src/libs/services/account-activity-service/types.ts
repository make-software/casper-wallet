import { ErrorResponse, PaginatedResponse } from '@libs/services/types';
import { CLTypeParsedResult, CLTypeTypeResult } from '@libs/types/cl';

export interface TransferResult {
  amount: string;
  blockHash: string;
  deployHash: string;
  fromAccount: string;
  fromAccountPublicKey: string;
  toAccount: string | null;
  toAccountPublicKey: string;
  transferId: string;
  timestamp: string;
  targetPurse: string;
  rate?: number;
}

export interface TransferResultWithId extends TransferResult {
  id: string;
}

export interface MappedPendingTransaction extends ExtendedDeployWithId {
  fromAccountPublicKey: string;
  toAccountPublicKey: string;
  amount: string;
}

export type ExtendedDeployClTypeResult = {
  cl_type: CLTypeTypeResult;
  parsed: CLTypeParsedResult | string | null;
};

export type ExtendedDeployArgsResult = {
  amount?: ExtendedDeployClTypeResult;
  spender?: ExtendedDeployClTypeResult;
  bsc_recipient_address?: ExtendedDeployClTypeResult;
  contract_hash_str?: ExtendedDeployClTypeResult;
  recipient?: ExtendedDeployClTypeResult;
  token_id?: ExtendedDeployClTypeResult;
  token_ids?: ExtendedDeployClTypeResult;
  token_meta?: ExtendedDeployClTypeResult;
  id?: ExtendedDeployClTypeResult;
  target?: ExtendedDeployClTypeResult;
  contract_name?: ExtendedDeployClTypeResult;
  decimals?: ExtendedDeployClTypeResult;
  initial_supply?: ExtendedDeployClTypeResult;
  name?: ExtendedDeployClTypeResult;
  symbol?: ExtendedDeployClTypeResult;
  amount_in?: ExtendedDeployClTypeResult;
  amount_out_min?: ExtendedDeployClTypeResult;
  deadline?: ExtendedDeployClTypeResult;
  path?: ExtendedDeployClTypeResult;
  to?: ExtendedDeployClTypeResult;
  validator?: ExtendedDeployClTypeResult;
  new_validator?: ExtendedDeployClTypeResult;
  delegator?: ExtendedDeployClTypeResult;
};

export interface ExtendedDeployResult {
  // means it's a pending deploy
  pending?: boolean;
  amount: string | null;
  args: ExtendedDeployArgsResult;
  block_hash: string | null;
  caller_public_key: string;
  contract_hash: string | null;
  contract_package_hash: string | null;
  cost: string;
  currency_cost: number;
  deploy_hash: string;
  error_message: string | null;
  payment_amount: string | null;
  status: string;
  timestamp: string;
  entry_point?: ExtendedDeployEntryPointResult;
  contract_package?: ExtendedDeployContractPackageResult;
  execution_type_id: 1 | 2 | 3 | 4 | 5 | 6;
  rate: number;
  error?: { message: string };
}

export interface ExtendedDeploy {
  // means it's a pending deploy
  pending?: boolean;
  amount: string | null;
  args: ExtendedDeployArgsResult;
  blockHash: string | null;
  callerPublicKey: string;
  contractHash: string | null;
  contractPackageHash: string | null;
  cost: string;
  deployHash: string;
  errorMessage: string | null;
  paymentAmount: string | null;
  status: string;
  timestamp: string;
  entryPoint?: ExtendedDeployEntryPointResult;
  contractPackage?: ExtendedDeployContractPackageResult;
  executionTypeId: 1 | 2 | 3 | 4 | 5 | 6;
  rate: number;
  currencyCost: number;
}

export interface ExtendedDeployWithId extends ExtendedDeploy {
  id: string;
}

export const MapExtendedDeploy = ({
  deploy_hash,
  block_hash,
  caller_public_key,
  contract_hash,
  contract_package_hash,
  error_message,
  payment_amount,
  entry_point,
  contract_package,
  execution_type_id,
  currency_cost,
  rate,
  ...rest
}: ExtendedDeployResult): ExtendedDeploy => ({
  ...rest,
  deployHash: deploy_hash,
  blockHash: block_hash,
  callerPublicKey: caller_public_key,
  contractHash: contract_hash,
  contractPackageHash: contract_package_hash,
  errorMessage: error_message,
  paymentAmount: payment_amount,
  entryPoint: entry_point,
  contractPackage: contract_package,
  executionTypeId: execution_type_id,
  currencyCost: currency_cost,
  rate: rate
});

export type ExtendedDeployContractPackageMetadata = {
  symbol: string;
  decimals: number;
  balances_uref: string;
  total_supply_uref: string;
  burn_mode?: string;
  holder_mode?: string;
  identifier_mode?: string;
  metadata_mutability?: string;
  minting_mode?: string;
  nft_kind?: string;
  nft_metadata_kind?: string;
  ownership_mode?: string;
  whitelist_mode?: string;
  owner_reverse_lookup_mode?: string;
};

export type ExtendedDeployContractPackageResult = {
  contract_description: string | null;
  contract_name: string | null;
  contract_package_hash: string;
  contract_type_id: number | null;
  owner_public_key: string | null;
  timestamp: string;
  deploys_num?: number;
  metadata?: ExtendedDeployContractPackageMetadata;
  icon_url?: string;
};

export type ExtendedDeployEntryPointResult = {
  action_type_id: null;
  contract_hash: string | null;
  contract_package_hash: string | null;
  id: string | null;
  name: string | null;
};

export interface Erc20TokenActionResult {
  deploy_hash: string;
  contract_package_hash: string;
  from_type: string | null;
  from_hash: string | null;
  from_public_key?: string | null;
  to_type: string | null;
  to_hash: string | null;
  to_public_key?: string;
  erc20_action_type_id: number;
  amount: string;
  timestamp: string;
  deploy?: Deploy;
  contract_package?: ContractPackage;
}

export interface Deploy {
  deploy_hash: string;
  block_hash: string;
  caller_public_key: string;
  execution_type_id: number;
  contract_hash: string;
  contract_package_hash: string;
  cost: string;
  payment_amount: string;
  error_message: string | null;
  timestamp: string;
  status: string;
  args: any;
  amount?: string;
  currency_cost: number;
  rate: number;
  current_currency_cost: number;
}

export interface ContractPackage {
  contract_package_hash: string;
  owner_public_key: string;
  contract_type_id: number;
  contract_name: string | null;
  contract_description: string | null;
  icon_url: string | null;
  metadata: Metadata;
  timestamp: string;
}

export interface Metadata {
  symbol: string;
  decimals: number;
  balances_uref: string;
  total_supply_uref: string;
}

export type Erc20TransferWithId = {
  id: string;
  amount?: string;
  deployHash: string;
  callerPublicKey: string;
  timestamp: string;
  args: ExtendedDeployArgsResult;
  status: string;
  errorMessage: string | null;
  decimals?: number;
  symbol?: string;
  toPublicKey?: string;
  fromPublicKey?: string | null;
  contractPackage?: ContractPackage | null;
  toHash: string | null;
  toType: string | null;
};
