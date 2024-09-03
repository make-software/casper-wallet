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
