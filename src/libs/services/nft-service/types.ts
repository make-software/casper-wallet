import { ExtendedDeployContractPackageResult } from '@libs/services/account-activity-service';

export interface NFTTokenMetadataEntry {
  key: string;
  value: string;
}

export interface NFTTokenMetadata {
  name?: string;
  description?: string;
  nftPreview?: string;
  contentIpfs?: string;
  pictureIpfs?: string;
}

export interface NFTTokenResult {
  tracking_id: string;
  token_standard_id: number;
  is_burned: boolean;
  contract_package_hash: string;
  contract_package?: ExtendedDeployContractPackageResult;
  token_id: string;
  owner_account_hash: string;
  owner_public_key: string;
  metadata: NFTTokenMetadataEntry[];
  offchain_metadata: Record<string, any>;
  onchain_metadata: Record<string, any>;
  timestamp: string;
}
