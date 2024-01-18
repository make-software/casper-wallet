export interface GetCurrencyRateRequestResponse {
  data: number;
}

export interface AccountData {
  account_hash: string;
  balance: number;
  delegated_balance?: number;
  main_purse_uref: string;
  public_key: string;
  undelegating_balance?: number;
}

export interface FetchBalanceResponse {
  currencyRate: number | null;
  accountData: AccountData[] | null;
}

export interface AccountBalance {
  liquidMotes: string | null;
  delegatedMotes: string | null;
  undelegatingMotes: string | null;
  totalBalanceMotes: string | null;
  totalBalanceFiat: string | null;
}
