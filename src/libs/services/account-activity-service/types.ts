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
