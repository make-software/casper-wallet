import {
  ISwapFlowState,
  IWrapFlowState,
  SWAP_PROTOCOL_FEE,
  TransactionStatus,
  WrapDirection
} from 'casper-wallet-core';
import { TOKEN_DISPLAY_DECIMALS } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';

// Deep path: the layout barrel reaches webextension-polyfill, which throws under the node-only
// jest environment this module's tests run in.
import type { NavLinkTokenBalance } from '@libs/layout/header/nav-link-balance';

import { formatAmountForDisplay } from './amount-input-utils';
import { ISwapReviewData } from './types';

export enum SwapSteps {
  Form,
  Confirm,
  ConfirmWithLedger,
  Success
}

/** The step a Back press should land on, or `null` to leave the page entirely. */
export const getPreviousSwapStep = (step: SwapSteps): SwapSteps | null => {
  switch (step) {
    case SwapSteps.Confirm:
      return SwapSteps.Form;
    case SwapSteps.ConfirmWithLedger:
      return SwapSteps.Confirm;
    default:
      return null;
  }
};

/** One leg of the swap, as the confirm screen's first card renders it. */
export interface ISwapAmountRow {
  id: 'pay' | 'receive';
  label: string;
  icon: string | null;
  amount: string;
  symbol: string;
  fiat: string | null;
}

/** One key/value line of the confirm screen's details card. */
export interface ISwapDetailRow {
  id: 'rate' | 'priceImpact' | 'fee';
  text: string;
  value: string;
}

/** One leg of the running flow, as the confirm screen renders it while submitting. */
export interface ISwapProgressRow {
  id: 'approval' | 'swap' | 'wrap';
  text: string;
  status: TransactionStatus;
  /** A short note under the row — "Not needed", or the leg's error. `null` when there is none. */
  hint: string | null;
}

export const buildSwapAmountRows = (
  review: ISwapReviewData,
  translate: (key: string) => string
): ISwapAmountRow[] => {
  if (review.kind === 'wrap') {
    return [
      {
        id: 'pay',
        label: translate('You pay'),
        icon: review.sourceToken.icon,
        amount: review.amountFormatted,
        symbol: review.sourceToken.symbol,
        fiat: review.fiatAmount
      },
      {
        id: 'receive',
        label: translate('You receive'),
        icon: review.destinationToken.icon,
        amount: review.amountFormatted,
        symbol: review.destinationToken.symbol,
        fiat: review.fiatAmount
      }
    ];
  }

  const { trade } = review;

  return [
    {
      id: 'pay',
      label: translate('You pay'),
      icon: trade.firstToken.icon,
      amount: trade.firstToken.amountFormatted,
      symbol: trade.firstToken.symbol,
      fiat: trade.firstToken.fiatAmount ?? null
    },
    {
      id: 'receive',
      label: translate('You receive'),
      icon: trade.secondToken.icon,
      amount: trade.secondToken.amountFormatted,
      symbol: trade.secondToken.symbol,
      fiat: trade.secondToken.fiatAmount ?? null
    }
  ];
};

/**
 * The three lines cspr.trade shows when reviewing a swap. A line whose value is unknown is left
 * out rather than shown empty. A wrap or unwrap has no rate, price impact or fee, so it always
 * returns an empty list — the caller renders no details card for it.
 */
export const buildSwapDetailRows = (
  review: ISwapReviewData,
  translate: (key: string) => string
): ISwapDetailRow[] => {
  if (review.kind === 'wrap') {
    return [];
  }

  const rows: ISwapDetailRow[] = [];

  if (review.rate != null) {
    rows.push({ id: 'rate', text: translate('Rate'), value: review.rate });
  }

  if (review.priceImpact != null) {
    rows.push({
      id: 'priceImpact',
      text: translate('Price impact'),
      value: `-${review.priceImpact}%`
    });
  }

  if (review.protocolFee != null) {
    rows.push({
      id: 'fee',
      text: `${translate('Fee')} ${SWAP_PROTOCOL_FEE * 100}%`,
      value: `${review.protocolFee} ${review.trade.firstToken.symbol}`
    });
  }

  return rows;
};

export const buildSwapProgressRows = (
  state: ISwapFlowState,
  translate: (key: string) => string
): ISwapProgressRow[] => [
  {
    id: 'approval',
    text: translate('Approval'),
    status: state.approval.status,
    hint:
      state.approval.error ??
      (state.approval.isRequired ? null : translate('Not needed'))
  },
  {
    id: 'swap',
    text: translate('Swap'),
    status: state.swap.status,
    hint: state.swap.error ?? null
  }
];

/**
 * The wrap flow's single leg, as the confirm screen renders it while submitting. Unlike a swap
 * it has no approval, and `IWrapFlowState` carries no direction, so the caller passes one in.
 */
export const buildWrapProgressRows = (
  state: IWrapFlowState,
  direction: WrapDirection,
  translate: (key: string) => string
): ISwapProgressRow[] => [
  {
    id: 'wrap',
    text: translate(direction === 'wrap' ? 'Wrap' : 'Unwrap'),
    status: state.wrap.status,
    hint: state.wrap.error ?? null
  }
];

/**
 * Whether the swap leg has been accepted by a node — the wallet's definition of a submitted
 * transaction, and the gate on the success screen.
 *
 * Not `state.step === 'success'`: core only reaches that on a `swap:confirmed` event, which is
 * never emitted while the flow runs with `awaitSettlement: false`.
 */
export const isSwapSubmitted = (state: ISwapFlowState): boolean =>
  state.swap.status === 'awaiting' || state.swap.status === 'success';

/** See {@link isSwapSubmitted} — the wrap flow's single leg is judged the same way. */
export const isWrapSubmitted = (state: IWrapFlowState): boolean =>
  state.wrap.status === 'awaiting' || state.wrap.status === 'success';

/**
 * The pay leg's balance for the header, formatted like the amount cards. `null` until a token
 * is selected, so the header keeps its CSPR default rather than labelling a balance with no
 * symbol.
 */
export const buildPayTokenBalance = (
  payToken: IDexToken | null,
  formattedBalance: string
): NavLinkTokenBalance | null =>
  payToken == null
    ? null
    : {
        amount: formatAmountForDisplay(
          formattedBalance,
          TOKEN_DISPLAY_DECIMALS
        ),
        symbol: payToken.symbol
      };
