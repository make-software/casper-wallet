import { AccountInfoResult } from '@libs/types/account-info';
import { CLTypeParsedResult, CLTypeTypeResult } from '@libs/types/cl';

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
  owner?: ExtendedDeployClTypeResult;
  token_id?: ExtendedDeployClTypeResult;
  token_meta?: ExtendedDeployClTypeResult;
  token_metas?: ExtendedDeployClTypeResult;
  token_meta_data?: ExtendedDeployClTypeResult;
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
  tokens?: ExtendedDeployClTypeResult;
  delegator?: ExtendedDeployClTypeResult;
  validator?: ExtendedDeployClTypeResult;
  new_validator?: ExtendedDeployClTypeResult;
  offerer?: ExtendedDeployClTypeResult;
  collection?: ExtendedDeployClTypeResult;
  token_owner?: ExtendedDeployClTypeResult;
  operator?: ExtendedDeployClTypeResult;
  token_ids?: ExtendedDeployClTypeResult;
  target_key?: ExtendedDeployClTypeResult;
  source_key?: ExtendedDeployClTypeResult;
};

export type DeployTransferResult = {
  amount: string;
  block_height: number;
  deploy_hash: string;
  from_purse_public_key: string | null;
  from_purse: string;
  id: string | null;
  initiator_account_hash: string;
  timestamp: string;
  to_account_hash: string;
  to_purse: string;
  transform_key: string;
  to_purse_public_key: string | null;
};

export type ExtendedDeployEntryPointResult = {
  action_type_id: null;
  contract_hash: string | null;
  contract_package_hash: string | null;
  id: string | null;
  name: string | null;
};

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
  icon_url: string | null;
  contract_name: string | null;
  name: string | null;
  contract_package_hash: string;
  contract_type_id: number | null;
  latest_version_contract_type_id: number | null;
  owner_public_key: string | null;
  timestamp: string;
  deploys_num?: number;
  activity_num?: number;
  metadata?: ExtendedDeployContractPackageMetadata;
};

export type NftCloudActionsResult = {
  block_height: number;
  contract_package: ExtendedDeployContractPackageResult;
  contract_package_hash: string;
  deploy_hash: string;
  from_hash: null;
  from_public_key: string | null;
  from_type: null;
  nft_action_id: number;
  timestamp: string;
  to_hash: string;
  to_public_key: string | null;
  to_type: number;
  token_id: string;
  token_tracking_id: number;
};

export enum TransactorHashType {
  'account' = 0,
  'hash' = 1
}

export type FTActionsResult = {
  amount: string;
  contract_package: ExtendedDeployContractPackageResult;
  contract_package_hash: string;
  deploy_hash: string;
  ft_action_type_id: number;
  from_hash: string;
  from_public_key: string | null;
  from_type: TransactorHashType;
  timestamp: string;
  to_hash: string;
  to_public_key: string | null;
  to_type: TransactorHashType;
};

export interface ExtendedCloudDeploy {
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
  transfers?: DeployTransferResult[];
  entryPoint?: ExtendedDeployEntryPointResult;
  contractPackage: ExtendedDeployContractPackageResult;
  executionTypeId: number;
  timeTransactionCurrencyRate: number;
  nftActions?: NftCloudActionsResult[];
  ftActions?: FTActionsResult[];
  accountInfo?: AccountInfoResult;
}
