import { ISwapQuotedTrade, SwapQuoteType } from 'casper-wallet-core';

import { toStartSwapFlowParams } from '@popup/pages/swap/swap-flow-params';

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

describe('toStartSwapFlowParams', () => {
  // Matrix row: "A re-hydrated swap with a recorded approval".
  it('passes a recorded approval through to the flow start params', () => {
    const result = toStartSwapFlowParams({
      kind: 'swap',
      trade,
      slippage: 1.5,
      deadline: 20,
      pendingApproval: { hash: 'aa'.repeat(32), isDeploy: false }
    });

    expect(result.pendingApproval).toEqual({
      hash: 'aa'.repeat(32),
      isDeploy: false
    });
  });

  // Matrix row: "A re-hydrated swap without one".
  it('omits pendingApproval entirely, not as an undefined-valued key, when none is recorded', () => {
    const result = toStartSwapFlowParams({
      kind: 'swap',
      trade,
      slippage: 1.5,
      deadline: 20
    });

    expect('pendingApproval' in result).toBe(false);
  });

  // Matrix row: "The popup's own retry passes it" — the same mapper, fed the ref-carried
  // approval a previous attempt in the popup recorded, behaves identically to a re-hydration.
  it("passes the popup's own retry approval through the same as a re-hydration", () => {
    const result = toStartSwapFlowParams({
      kind: 'swap',
      trade,
      slippage: 1.5,
      deadline: 20,
      pendingApproval: { hash: 'bb'.repeat(32), isDeploy: true }
    });

    expect(result.pendingApproval).toEqual({
      hash: 'bb'.repeat(32),
      isDeploy: true
    });
  });

  // Matrix row: "A first attempt passes nothing".
  it('omits pendingApproval for a first attempt', () => {
    const result = toStartSwapFlowParams({
      kind: 'swap',
      trade,
      slippage: 1.5,
      deadline: 20
    });

    expect('pendingApproval' in result).toBe(false);
  });

  // Matrix row: "The trade terms still come from the payload".
  it('carries the parked slippage and deadline, not current settings', () => {
    const result = toStartSwapFlowParams({
      kind: 'swap',
      trade,
      slippage: 2.5,
      deadline: 45
    });

    expect(result).toMatchObject({
      ...trade,
      slippage: 2.5,
      deadline: 45
    });
  });
});
