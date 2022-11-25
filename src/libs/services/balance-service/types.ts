export interface GetAccountBalanceResponse {
  data: string;
}

export interface GetCurrencyRateResponse {
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
