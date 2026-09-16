import { IDexToken, ISwapQuotedTrade, WrapDirection } from 'casper-wallet-core';

export interface ISwapTradeReview {
  kind: 'swap';
  trade: ISwapQuotedTrade;
  rate: string | null;
  priceImpact: string | null;
  /** Bare amount, no symbol: the detail row appends the first token's symbol itself. */
  protocolFee: string | null;
}

export interface IWrapTradeReview {
  kind: 'wrap';
  direction: WrapDirection;
  sourceToken: IDexToken;
  destinationToken: IDexToken;
  /** Wrapping is 1:1, so one amount describes both legs. */
  amountFormatted: string;
  rawAmount: string;
  fiatAmount: string | null;
  /** Already worded for display — fiat when a rate had loaded, otherwise the CSPR figure. */
  networkCost: string;
}

/** Plain JSON throughout: it travels through router state, which is structured-cloned. */
export type ISwapReviewData = ISwapTradeReview | IWrapTradeReview;
