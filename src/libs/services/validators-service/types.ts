export interface ValidatorResult {
  fee: number;
  is_active: boolean;
  self_stake: string;
  bid_amount: string;
  total_stake: string;
  self_share: string;
  public_key: string;
  network_share: string;
  era_id: number;
  delegators_number: number;
  delegator_stake: string;
  rank: number;
  account_info?: AccountInfoResult;
  average_performance?: ValidatorAveragePerformanceResult;
}

export interface ValidatorResultWithId extends ValidatorResult {
  id: string;
  user_stake?: string;
}

export interface ValidatorAveragePerformanceResult {
  era_id: number;
  public_key: string;
  average_score: number; // between 0 and 100, treat it as percentage
}

export interface AccountInfoResult {
  account_hash: string;
  url: string;
  is_active: boolean;
  deploy_hash: string;
  verified_account_hashes: string[];
  info?: {
    owner?: AccountInfoOwner;
    nodes?: Array<AccountInfoNode>;
  };
}

export interface AccountInfoOwner {
  name?: string;
  description?: string;
  type?: Array<string>;
  email?: string;
  identity?: {
    ownership_disclosure_url?: string;
    casper_association_kyc_url?: string;
    casper_association_kyc_onchain?: string;
  };
  resources?: {
    code_of_conduct_url?: string;
    terms_of_service_url?: string;
    privacy_policy_url?: string;
    other?: Array<{
      name?: string;
      url?: string;
    }>;
  };
  affiliated_accounts?: Array<AccountInfoAffiliatedAccount>;
  website?: string;
  branding?: {
    logo?: {
      svg?: string;
      png_256?: string;
      png_1024?: string;
    };
  };
  location?: {
    name?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  social?: {
    github?: string;
    medium?: string;
    reddit?: string;
    wechat?: string;
    keybase?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    telegram?: string;
  };
}

export interface AccountInfoAffiliatedAccount {
  public_key?: string;
}

export interface AccountInfoNode {
  public_key?: string;
  description?: string;
  functionality?: string[];
  location?: {
    name?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface DelegatorResult {
  validator_public_key: string;
  public_key: string;
  stake: string;
  bonding_purse: string;
  account_info?: AccountInfoResult;
  validator_account_info?: ValidatorAccountInfoResult;
  validator: ValidatorResult;
}

export interface ValidatorAccountInfoResult {
  account_hash: string;
  deploy_hash: string;
  info: {
    owner?: AccountInfoOwner;
    nodes?: Array<AccountInfoNode>;
  };
  is_active: boolean;
  url: string;
  verified_account_hashes: string[];
}
