import { CLTypeParsedResult, CLTypeTypeResult } from '@libs/types/cl';

export interface LedgerLiveDeploysResult {
  deploy_hash: string;
  block_hash: string;
  caller_public_key: string;
  execution_type_id: 1 | 2 | 3 | 4 | 5 | 6;
  contract_hash: string | null;
  contract_package_hash: string | null;
  cost: string;
  payment_amount: string | null;
  error_message: string | null;
  timestamp: string;
  status: string;
  amount: null | string;
  args: {
    id: {
      parsed: number;
      cl_type: CLTypeTypeResult;
    };
    amount: {
      parsed: string;
      cl_type: CLTypeTypeResult;
    };
    target: {
      parsed: string;
      cl_type: CLTypeTypeResult;
    };
  };
}

export interface LedgerLiveDeploysWithId extends LedgerLiveDeploysResult {
  id: string;
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
};

export type ExtendedDeployEntryPointResult = {
  action_type_id: null;
  contract_hash: string | null;
  contract_package_hash: string | null;
  id: string | null;
  name: string | null;
};
