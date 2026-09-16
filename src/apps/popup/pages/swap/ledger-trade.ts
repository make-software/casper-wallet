import {
  ISwapQuotedTrade,
  SwapQuoteType,
  WrapDirection
} from 'casper-wallet-core';

export type ILedgerSwapPayload =
  | {
      kind: 'swap';
      trade: ISwapQuotedTrade;
      slippage: number;
      deadline: number;
      /**
       * An approval this trade already submitted. Parked so the permission window, which starts
       * a fresh flow, waits for it instead of submitting a second one.
       */
      pendingApproval?: { hash: string; isDeploy: boolean };
    }
  | { kind: 'wrap'; direction: WrapDirection; rawAmount: string };

const isDexTokenShape = (value: unknown): boolean =>
  typeof value === 'object' &&
  value != null &&
  typeof (value as { amountRaw?: unknown }).amountRaw === 'string' &&
  typeof (value as { symbol?: unknown }).symbol === 'string';

const isPendingApprovalShape = (
  value: unknown
): value is { hash: string; isDeploy: boolean } =>
  typeof value === 'object' &&
  value != null &&
  typeof (value as { hash?: unknown }).hash === 'string' &&
  typeof (value as { isDeploy?: unknown }).isDeploy === 'boolean';

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

export const serializeLedgerSwapPayload = (
  payload: ILedgerSwapPayload
): string => JSON.stringify(payload);

/** Never throws: an unreadable parked payload falls back to the single-transaction flow. */
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
    const { trade, slippage, deadline, pendingApproval } = parsed as {
      trade?: unknown;
      slippage?: unknown;
      deadline?: unknown;
      pendingApproval?: unknown;
    };

    if (
      isQuotedTradeShape(trade) &&
      typeof slippage === 'number' &&
      Number.isFinite(slippage) &&
      typeof deadline === 'number' &&
      Number.isFinite(deadline) &&
      (pendingApproval === undefined || isPendingApprovalShape(pendingApproval))
    ) {
      return {
        kind: 'swap',
        trade,
        slippage,
        deadline,
        ...(pendingApproval === undefined ? {} : { pendingApproval })
      };
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
