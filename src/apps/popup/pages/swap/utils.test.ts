import {
  CORE_ERROR_MESSAGE_KEYS,
  IDexToken,
  IDexTokenWithAmount,
  ISwapFlowState,
  IWrapFlowState,
  LedgerEventStatus,
  SwapQuoteType,
  initialSwapFlowState,
  initialWrapFlowState
} from 'casper-wallet-core';

import { ISwapTradeReview, IWrapTradeReview } from '@popup/pages/swap/types';
import {
  ISwapBalanceFlags,
  SwapSteps,
  buildPayTokenBalance,
  buildSwapAmountRows,
  buildSwapDetailRows,
  buildSwapProgressRows,
  buildWrapProgressRows,
  getPreviousSwapStep,
  resolveLegErrorHint,
  resolveSwapBalanceBanner
} from '@popup/pages/swap/utils';

const translate = (key: string) => key;

describe('getPreviousSwapStep', () => {
  it('returns to the form from confirm', () => {
    expect(getPreviousSwapStep(SwapSteps.Confirm)).toBe(SwapSteps.Form);
  });

  it('leaves the page from the form', () => {
    expect(getPreviousSwapStep(SwapSteps.Form)).toBeNull();
  });

  it('returns to confirm from confirm-with-ledger', () => {
    expect(getPreviousSwapStep(SwapSteps.ConfirmWithLedger)).toBe(
      SwapSteps.Confirm
    );
  });

  it('leaves the page from success', () => {
    expect(getPreviousSwapStep(SwapSteps.Success)).toBeNull();
  });
});

const token = (
  overrides: Partial<IDexTokenWithAmount> = {}
): IDexTokenWithAmount => ({
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
  amountRaw: '500000000000',
  fiatAmount: '$2.09',
  ...overrides
});

const review = (
  overrides: Partial<ISwapTradeReview> = {}
): ISwapTradeReview => ({
  kind: 'swap',
  trade: {
    firstToken: token({ id: 'aa', symbol: 'SWPR', amountFormatted: '500' }),
    secondToken: token({
      id: 'bb',
      symbol: 'FATSO',
      amountFormatted: '1921.899324523'
    }),
    path: ['aa', 'bb'],
    quoteType: SwapQuoteType.ExactIn
  },
  rate: '1 SWPR = 3.3890389533 FATSO',
  priceImpact: '2.51',
  protocolFee: '1.5',
  ...overrides
});

const flow = (overrides: Partial<ISwapFlowState> = {}): ISwapFlowState => ({
  ...initialSwapFlowState,
  ...overrides
});

const dexToken = (overrides: Partial<IDexToken> = {}): IDexToken => ({
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
  ...overrides
});

const wrapReview = (
  overrides: Partial<IWrapTradeReview> = {}
): IWrapTradeReview => ({
  kind: 'wrap',
  direction: 'wrap',
  sourceToken: dexToken({ symbol: 'CSPR' }),
  destinationToken: dexToken({ id: 'wcspr', symbol: 'WCSPR' }),
  amountFormatted: '5',
  rawAmount: '5000000000',
  fiatAmount: '$1.23',
  networkCost: '$0.12',
  ...overrides
});

const wrapFlow = (overrides: Partial<IWrapFlowState> = {}): IWrapFlowState => ({
  ...initialWrapFlowState,
  ...overrides
});

describe('buildSwapAmountRows', () => {
  it('puts the paid leg first and the received leg second', () => {
    const rows = buildSwapAmountRows(review(), translate);

    expect(rows.map(row => [row.label, row.amount, row.symbol])).toEqual([
      ['You pay', '500', 'SWPR'],
      ['You receive', '1921.899324523', 'FATSO']
    ]);
  });

  it('carries the fiat value of each leg', () => {
    expect(buildSwapAmountRows(review(), translate).map(r => r.fiat)).toEqual([
      '$2.09',
      '$2.09'
    ]);
  });

  it('renders a leg with no fiat value as null rather than omitting it', () => {
    const rows = buildSwapAmountRows(
      review({
        trade: {
          ...review().trade,
          secondToken: token({ symbol: 'FATSO', fiatAmount: undefined })
        }
      }),
      translate
    );

    expect(rows).toHaveLength(2);
    expect(rows[1].fiat).toBeNull();
  });

  it('renders both wrap legs with the same amount and fiat', () => {
    const rows = buildSwapAmountRows(wrapReview(), translate);

    expect(rows.map(row => [row.label, row.amount, row.symbol])).toEqual([
      ['You pay', '5', 'CSPR'],
      ['You receive', '5', 'WCSPR']
    ]);
    expect(rows.map(row => row.fiat)).toEqual(['$1.23', '$1.23']);
  });

  it('reverses pay/receive symbols for an unwrap', () => {
    const rows = buildSwapAmountRows(
      wrapReview({
        direction: 'unwrap',
        sourceToken: dexToken({ id: 'wcspr', symbol: 'WCSPR' }),
        destinationToken: dexToken({ symbol: 'CSPR' })
      }),
      translate
    );

    expect(rows.map(row => [row.label, row.symbol])).toEqual([
      ['You pay', 'WCSPR'],
      ['You receive', 'CSPR']
    ]);
  });

  it('renders both wrap rows with a null fiat when the wrap has none', () => {
    const rows = buildSwapAmountRows(
      wrapReview({ fiatAmount: null }),
      translate
    );

    expect(rows).toHaveLength(2);
    expect(rows.map(row => row.fiat)).toEqual([null, null]);
  });
});

describe('buildSwapDetailRows', () => {
  it('renders rate, price impact and fee in that order', () => {
    expect(
      buildSwapDetailRows(review(), translate).map(row => [row.text, row.value])
    ).toEqual([
      ['Rate', '1 SWPR = 3.3890389533 FATSO'],
      ['Price impact', '-2.51%'],
      ['Fee 0.3%', '1.5 SWPR']
    ]);
  });

  it('omits the price impact row when it is unknown', () => {
    expect(
      buildSwapDetailRows(review({ priceImpact: null }), translate).map(
        row => row.text
      )
    ).toEqual(['Rate', 'Fee 0.3%']);
  });

  it('omits the rate row when it is unknown', () => {
    expect(
      buildSwapDetailRows(review({ rate: null }), translate).map(
        row => row.text
      )
    ).toEqual(['Price impact', 'Fee 0.3%']);
  });

  it('omits the fee row when it is unknown', () => {
    expect(
      buildSwapDetailRows(review({ protocolFee: null }), translate).map(
        row => row.text
      )
    ).toEqual(['Rate', 'Price impact']);
  });

  it('returns nothing when no detail is known', () => {
    expect(
      buildSwapDetailRows(
        review({ rate: null, priceImpact: null, protocolFee: null }),
        translate
      )
    ).toEqual([]);
  });

  it('shows gas alone for a wrap review — it has no rate, impact or protocol fee', () => {
    expect(
      buildSwapDetailRows(wrapReview(), translate).map(row => [
        row.text,
        row.value
      ])
    ).toEqual([['Network Cost', '$0.12']]);
  });

  it('carries the wrap review its own network cost rather than recomputing one', () => {
    expect(
      buildSwapDetailRows(
        wrapReview({ direction: 'unwrap', networkCost: '5 CSPR' }),
        translate
      ).map(row => row.value)
    ).toEqual(['5 CSPR']);
  });
});

describe('buildSwapProgressRows', () => {
  it('describes both legs while the approval is in flight', () => {
    const rows = buildSwapProgressRows(
      flow({
        approval: { isRequired: true, status: 'awaiting' },
        swap: { status: 'idle' }
      }),
      translate
    );

    expect(rows.map(row => [row.id, row.status])).toEqual([
      ['approval', 'awaiting'],
      ['swap', 'idle']
    ]);
    expect(rows[0].text).toBe('Approval');
    expect(rows[1].text).toBe('Swap');
  });

  it('marks an unneeded approval as already done', () => {
    const rows = buildSwapProgressRows(
      flow({ approval: { isRequired: false, status: 'success' } }),
      translate
    );

    expect(rows[0].status).toBe('success');
    expect(rows[0].hint).toBe('Not needed');
  });

  it('surfaces a leg error as that row hint', () => {
    const rows = buildSwapProgressRows(
      flow({ swap: { status: 'error', error: 'Transaction failed' } }),
      translate
    );

    expect(rows[1].hint).toBe('Transaction failed');
  });

  it('leaves the hint empty for a leg with nothing to say', () => {
    expect(buildSwapProgressRows(flow(), translate)[1].hint).toBeNull();
  });
});

describe('buildWrapProgressRows', () => {
  it('describes a wrap in flight as one row', () => {
    const rows = buildWrapProgressRows(
      wrapFlow({ wrap: { status: 'pending' } }),
      'wrap',
      translate
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('wrap');
    expect(rows[0].text).toBe('Wrap');
    expect(rows[0].status).toBe('pending');
  });

  it('labels an unwrap in flight as Unwrap', () => {
    const rows = buildWrapProgressRows(
      wrapFlow({ wrap: { status: 'pending' } }),
      'unwrap',
      translate
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('Unwrap');
  });

  it('surfaces a failed leg as that row hint', () => {
    const rows = buildWrapProgressRows(
      wrapFlow({ wrap: { status: 'error', error: 'Transaction failed' } }),
      'wrap',
      translate
    );

    expect(rows[0].hint).toBe('Transaction failed');
  });

  it('leaves the hint empty for a leg with nothing to say', () => {
    expect(
      buildWrapProgressRows(wrapFlow(), 'wrap', translate)[0].hint
    ).toBeNull();
  });
});

describe('resolveLegErrorHint', () => {
  it('never renders a Ledger status enum', () => {
    const hint = resolveLegErrorHint(LedgerEventStatus.DeviceLocked, translate);

    expect(hint).toBe('The Ledger device is locked');
    expect(hint).not.toContain('ledger-');
  });

  it('never renders a raw core error key', () => {
    const [key] = CORE_ERROR_MESSAGE_KEYS;
    const hint = resolveLegErrorHint(key, translate);

    expect(hint).not.toBeNull();
    expect(hint).not.toContain('errors:');
  });

  it.each(CORE_ERROR_MESSAGE_KEYS.map(key => [key]))(
    'has copy for the core key %s',
    key => {
      expect(resolveLegErrorHint(key, translate)).not.toContain('errors:');
    }
  );

  it('shows a node message as it arrived', () => {
    expect(resolveLegErrorHint('deploy is invalid: expired', translate)).toBe(
      'deploy is invalid: expired'
    );
  });

  it.each([[undefined], ['']])('has no hint for %p', error => {
    expect(resolveLegErrorHint(error, translate)).toBeNull();
  });
});

describe('buildPayTokenBalance', () => {
  it('labels the balance with the pay token, not CSPR', () => {
    expect(
      buildPayTokenBalance(dexToken({ symbol: 'SHIBOO' }), '1234.5')
    ).toEqual({ amount: '1,234.5', symbol: 'SHIBOO' });
  });

  it('truncates the balance to the displayed decimals', () => {
    expect(buildPayTokenBalance(dexToken(), '0.1234567891')).toEqual({
      amount: '0.12345',
      symbol: 'CSPR'
    });
  });

  it('keeps a zero balance', () => {
    expect(buildPayTokenBalance(dexToken({ symbol: 'FATSO' }), '0')).toEqual({
      amount: '0',
      symbol: 'FATSO'
    });
  });

  it('has no balance to show before a token is picked', () => {
    expect(buildPayTokenBalance(null, '1234.5')).toBeNull();
  });
});

describe('resolveSwapBalanceBanner', () => {
  const flags = (overrides: Partial<ISwapBalanceFlags> = {}) => ({
    isAmountEntered: true,
    hasInsufficientBalance: false,
    hasInsufficientCsprForFee: false,
    ...overrides
  });

  it('says nothing before an amount is entered', () => {
    expect(
      resolveSwapBalanceBanner(
        flags({ isAmountEntered: false, hasInsufficientCsprForFee: true })
      )
    ).toBeNull();
  });

  it('reports a pay leg the balance cannot cover', () => {
    expect(
      resolveSwapBalanceBanner(flags({ hasInsufficientBalance: true }))
    ).toBe('insufficientBalance');
  });

  it('reports a CSPR balance that cannot cover the fee', () => {
    expect(
      resolveSwapBalanceBanner(flags({ hasInsufficientCsprForFee: true }))
    ).toBe('insufficientCsprForFee');
  });

  // Paying in CSPR trips both at once; the amount is the part the user can act on.
  it('prefers the balance over the fee when both are short', () => {
    expect(
      resolveSwapBalanceBanner(
        flags({ hasInsufficientBalance: true, hasInsufficientCsprForFee: true })
      )
    ).toBe('insufficientBalance');
  });

  it('says nothing when the balance covers both', () => {
    expect(resolveSwapBalanceBanner(flags())).toBeNull();
  });
});
