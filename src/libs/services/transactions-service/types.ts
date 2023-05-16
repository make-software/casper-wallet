export interface GetAccountTransactionsResponse {
  data: Transaction[];
  itemsCount: number;
  pageCount: number;
  pages: Page[];
}

export interface Transaction {
  amount: string;
  blockHash: string;
  currency_amount: number;
  current_currency_amount: number;
  deployHash: string;
  fromAccount: string;
  fromAccountPublicKey: string;
  rate: number;
  sourcePurse: string;
  targetPurse: string;
  timestamp: string;
  toAccount: string;
  toAccountPublicKey: string;
  transferId: null | string;
}

interface Page {
  number: number;
  url: string;
}
