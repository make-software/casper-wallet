export interface GetAccountBalanceRequestResponse {
  data: string;
}

export interface GetCurrencyRateRequestResponse {
  data: number;
}

export interface ActiveAccountBalance {
  amountMotes: string | null;
  amountFiat: string | null;
}

export interface FetchBalanceResponse {
  balance: string | null;
  currencyRate: number | null;
}
