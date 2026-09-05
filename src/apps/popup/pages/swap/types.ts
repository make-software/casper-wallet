import { IDexToken, ISwapQuotedTrade, WrapDirection } from 'casper-wallet-core';

export interface ISwapTradeReview {
  kind: 'swap';
  /** The four fields the swap is started from, all read off one quote. */
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
}

/**
 * Everything the confirm screen needs, as one object, so every value on it comes from the same
 * quote. Plain JSON throughout: it travels through router state, which is structured-cloned.
 *
 * The swap form produces it; the confirm step consumes it.
 */
export type ISwapReviewData = ISwapTradeReview | IWrapTradeReview;
