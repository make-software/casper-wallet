export interface Erc20Token {
  account_hash: string;
  balance: string;
  contract_package_hash: string;
  latest_contract?: {
    contract_hash: string;
    contract_package_hash: string;
    deploy_hash: string;
    contract_type_id: number;
    contract_version: number;
    is_disabled: boolean;
    protocol_version: string;
    timestamp: string;
  };
}

export interface ContractPackage {
  contract_description: string | null;
  contract_name: string;
  contract_package_hash: string;
  contract_type_id: number;
  metadata: {
    balances_uref: string;
    decimals: number;
    symbol: string;
    total_supply_uref: string;
  };
  owner_public_key: string;
  timestamp: string;
  contractHash?: string;
}

export interface ContractPackageWithBalance extends ContractPackage {
  balance: string;
}
