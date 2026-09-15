import {
  ISwapQuotedTrade,
  SwapQuoteType,
  WrapDirection
} from 'casper-wallet-core';

/** A composed swap or wrap awaiting a device signature — see `parseLedgerSwapPayload`. */
export type ILedgerSwapPayload =
  | {
      kind: 'swap';
      trade: ISwapQuotedTrade;
      slippage: number;
      deadline: number;
    }
  | { kind: 'wrap'; direction: WrapDirection; rawAmount: string };

const isDexTokenShape = (value: unknown): boolean =>
  typeof value === 'object' &&
  value != null &&
  typeof (value as { amountRaw?: unknown }).amountRaw === 'string' &&
  typeof (value as { symbol?: unknown }).symbol === 'string';

const isQuotedTradeShape = (value: unknown): value is ISwapQuotedTrade =>
  typeof value === 'object' &&
  value != null &&
  isDexTokenShape((value as { firstToken?: unknown }).firstToken) &&
  isDexTokenShape((value as { secondToken?: unknown }).secondToken) &&
  Array.isArray((value as { path?: unknown }).path) &&
  (value as { path: unknown[] }).path.every(
    entry => typeof entry === 'string'
  ) &&
  ((value as { quoteType?: unknown }).quoteType === SwapQuoteType.ExactIn ||
    (value as { quoteType?: unknown }).quoteType === SwapQuoteType.ExactOut);

/** The composed swap or wrap, as parked for the Ledger permission window. */
export const serializeLedgerSwapPayload = (
  payload: ILedgerSwapPayload
): string => JSON.stringify(payload);

/**
 * The parked swap or wrap, or `null` when nothing usable is stored. Never throws: a window that
 * cannot read a parked payload falls back to the single-transaction flow rather than failing to
 * render.
 */
export const parseLedgerSwapPayload = (
  raw: string | null
): ILedgerSwapPayload | null => {
  if (raw == null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed == null) {
    return null;
  }

  const { kind } = parsed as { kind?: unknown };

  if (kind === 'swap') {
    const { trade, slippage, deadline } = parsed as {
      trade?: unknown;
      slippage?: unknown;
      deadline?: unknown;
    };

    if (
      isQuotedTradeShape(trade) &&
      typeof slippage === 'number' &&
      Number.isFinite(slippage) &&
      typeof deadline === 'number' &&
      Number.isFinite(deadline)
    ) {
      return { kind: 'swap', trade, slippage, deadline };
    }

    return null;
  }

  if (kind === 'wrap') {
    const { direction, rawAmount } = parsed as {
      direction?: unknown;
      rawAmount?: unknown;
    };

    if (
      (direction === 'wrap' || direction === 'unwrap') &&
      typeof rawAmount === 'string'
    ) {
      return { kind: 'wrap', direction, rawAmount };
    }

    return null;
  }

  return null;
};
