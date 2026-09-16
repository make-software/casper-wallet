import { ISwapQuotedTrade, SwapQuoteType } from 'casper-wallet-core';

import {
  ILedgerSwapPayload,
  parseLedgerSwapPayload,
  serializeLedgerSwapPayload
} from '@popup/pages/swap/ledger-trade';

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

const swapPayload: ILedgerSwapPayload = {
  kind: 'swap',
  trade,
  slippage: 0.5,
  deadline: 20
};

const wrapPayload: ILedgerSwapPayload = {
  kind: 'wrap',
  direction: 'wrap',
  rawAmount: '500000000000'
};

describe('the parked Ledger swap payload', () => {
  it('survives the round trip through storage for a swap', () => {
    expect(
      parseLedgerSwapPayload(serializeLedgerSwapPayload(swapPayload))
    ).toEqual(swapPayload);
  });

  it('reads nothing parked as nothing', () => {
    expect(parseLedgerSwapPayload(null)).toBeNull();
  });

  it('refuses malformed JSON rather than throwing', () => {
    expect(parseLedgerSwapPayload('{oops')).toBeNull();
  });

  it('refuses a swap payload of the wrong shape', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({
          kind: 'swap',
          trade: { firstToken: trade.firstToken }
        })
      )
    ).toBeNull();
  });

  it('refuses a swap payload whose route is not a list of strings', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({
          kind: 'swap',
          trade: { ...trade, path: 'nope' },
          slippage: swapPayload.slippage,
          deadline: swapPayload.deadline
        })
      )
    ).toBeNull();
  });

  it('refuses a swap payload with a non-finite slippage or deadline', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({ ...swapPayload, slippage: Number.NaN })
      )
    ).toBeNull();
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({ ...swapPayload, deadline: Number.POSITIVE_INFINITY })
      )
    ).toBeNull();
  });

  it('survives the round trip through storage for a wrap', () => {
    expect(
      parseLedgerSwapPayload(serializeLedgerSwapPayload(wrapPayload))
    ).toEqual(wrapPayload);
  });

  it('refuses a wrap payload whose direction is neither wrap nor unwrap', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({ ...wrapPayload, direction: 'sideways' })
      )
    ).toBeNull();
  });

  it('refuses a wrap payload whose rawAmount is not a string', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({ ...wrapPayload, rawAmount: 500000000000 })
      )
    ).toBeNull();
  });

  it('refuses a payload with an unknown kind', () => {
    expect(
      parseLedgerSwapPayload(JSON.stringify({ kind: 'stake', trade }))
    ).toBeNull();
  });

  it('parses a swap payload from the installed version, with no pendingApproval field', () => {
    const parsed = parseLedgerSwapPayload(
      serializeLedgerSwapPayload(swapPayload)
    );

    expect(parsed).toEqual(swapPayload);
    expect(parsed?.kind === 'swap' && parsed.pendingApproval).toBeUndefined();
  });

  it('round-trips a recorded approval', () => {
    const payload: ILedgerSwapPayload = {
      ...swapPayload,
      pendingApproval: { hash: 'aa'.repeat(32), isDeploy: false }
    };

    expect(parseLedgerSwapPayload(serializeLedgerSwapPayload(payload))).toEqual(
      payload
    );
  });

  it('preserves isDeploy: true rather than coercing it', () => {
    const payload: ILedgerSwapPayload = {
      ...swapPayload,
      pendingApproval: { hash: 'aa'.repeat(32), isDeploy: true }
    };

    expect(parseLedgerSwapPayload(serializeLedgerSwapPayload(payload))).toEqual(
      payload
    );
  });

  it('refuses a pendingApproval whose hash is not a string', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({
          ...swapPayload,
          pendingApproval: { hash: 42, isDeploy: false }
        })
      )
    ).toBeNull();
  });

  it('refuses a pendingApproval missing the isDeploy flag', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({
          ...swapPayload,
          pendingApproval: { hash: 'aa'.repeat(32) }
        })
      )
    ).toBeNull();
  });

  it('refuses a non-object pendingApproval', () => {
    expect(
      parseLedgerSwapPayload(
        JSON.stringify({ ...swapPayload, pendingApproval: 'aa'.repeat(32) })
      )
    ).toBeNull();
  });
});
