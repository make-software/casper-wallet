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
  balance: string;
  currencyRate: number;
}

export interface DataWithPayload<T> {
  payload: T;
}

export interface GetAccountBalanceUrl {
  publicKey: string;
}
