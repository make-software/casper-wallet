export interface GetAccountBalanceRequestResponse {
  data: string;
}

export interface GetCurrencyRateRequestResponse {
  data: number;
}

export interface ActiveAccountBalance {
  amount: string;
  fiatAmount: string;
}

export interface FetchBalanceResponse {
  balance: string | null;
  currencyRate: number | null;
}
