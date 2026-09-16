import { ISwapQuotedTrade, SwapQuoteType } from 'casper-wallet-core';

import { ILedgerSwapPayload } from '@popup/pages/swap/ledger-trade';
import { resolveParkedSwapPayload } from '@popup/pages/swap/swap-repark';

const trade: ISwapQuotedTrade = {
  firstToken: {
    id: 'cspr',
    name: 'Casper',
    symbol: 'CSPR',
    icon: null,
    decimals: 9,
    packageHash: '0'.repeat(64),
    isWhitelisted: true,
    isBlacklisted: false,
    fiatRates: null,
    totalValueLocked: null,
    volume24h: null,
    amountFormatted: '500',
    amountRaw: '500000000000'
  },
  secondToken: {
    id: 'bb',
    name: 'Fatso',
    symbol: 'FATSO',
    icon: null,
    decimals: 18,
    packageHash: 'f'.repeat(64),
    isWhitelisted: true,
    isBlacklisted: false,
    fiatRates: null,
    totalValueLocked: null,
    volume24h: null,
    amountFormatted: '1921.899324523',
    amountRaw: '1921899324523000000000'
  },
  path: ['0'.repeat(64), 'f'.repeat(64)],
  quoteType: SwapQuoteType.ExactIn
};

const parkedSwap: ILedgerSwapPayload = {
  kind: 'swap',
  trade,
  slippage: 1.5,
  deadline: 20
};

const parkedWrap: ILedgerSwapPayload = {
  kind: 'wrap',
  direction: 'wrap',
  rawAmount: '500000000000'
};

describe('resolveParkedSwapPayload', () => {
  it('re-parks on the approval leg, carrying the hash forward', () => {
    expect(
      resolveParkedSwapPayload(
        { kind: 'sent', hash: 'aa'.repeat(32), isSubmitted: false },
        parkedSwap,
        false
      )
    ).toEqual({
      ...parkedSwap,
      pendingApproval: { hash: 'aa'.repeat(32), isDeploy: false }
    });
  });

  it('does not re-park the swap leg — the park is cleared as it is today', () => {
    expect(
      resolveParkedSwapPayload(
        { kind: 'sent', hash: 'bb'.repeat(32), isSubmitted: true },
        parkedSwap,
        false
      )
    ).toBeNull();
  });

  it("does not re-park a wrap's single leg — the park is cleared as it is today", () => {
    expect(
      resolveParkedSwapPayload(
        { kind: 'sent', hash: 'cc'.repeat(32), isSubmitted: true },
        parkedWrap,
        false
      )
    ).toBeNull();
  });

  it('preserves the trade terms the user confirmed when re-parking', () => {
    const result = resolveParkedSwapPayload(
      { kind: 'sent', hash: 'dd'.repeat(32), isSubmitted: false },
      parkedSwap,
      true
    );

    expect(result?.kind).toBe('swap');
    expect(result).toMatchObject({
      trade: parkedSwap.trade,
      slippage: parkedSwap.slippage,
      deadline: parkedSwap.deadline
    });
  });

  it('clears the park, including any recorded approval, on cancellation', () => {
    const withApproval: ILedgerSwapPayload = {
      ...parkedSwap,
      pendingApproval: { hash: 'ee'.repeat(32), isDeploy: false }
    };

    expect(
      resolveParkedSwapPayload({ kind: 'cancelled' }, withApproval, false)
    ).toBeNull();
  });
});
