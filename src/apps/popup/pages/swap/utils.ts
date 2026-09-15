import {
  ISwapFlowState,
  IWrapFlowState,
  SWAP_PROTOCOL_FEE,
  TransactionStatus,
  WrapDirection
} from 'casper-wallet-core';
import type { LedgerEventStatus } from 'casper-wallet-core';
import { TOKEN_DISPLAY_DECIMALS } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';

// Deep paths: the layout barrel reaches webextension-polyfill, which throws under the node-only
// jest environment this module's tests run in, and the ledger barrel reaches its transports.
import type { NavLinkTokenBalance } from '@libs/layout/header/nav-link-balance';
import { getCoreErrorCopy } from '@libs/services/core-errors';
import { ledgerErrorsData } from '@libs/services/ledger/errors';

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
  id: 'rate' | 'priceImpact' | 'fee' | 'networkCost';
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
 * out rather than shown empty. A wrap or unwrap has no rate, price impact or fee, so gas is all
 * it has to show.
 */
export const buildSwapDetailRows = (
  review: ISwapReviewData,
  translate: (key: string) => string
): ISwapDetailRow[] => {
  if (review.kind === 'wrap') {
    return [
      {
        id: 'networkCost',
        text: translate('Network Cost'),
        value: review.networkCost
      }
    ];
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

const isLedgerEventStatus = (value: string): value is LedgerEventStatus =>
  Object.prototype.hasOwnProperty.call(ledgerErrorsData, value);

/**
 * Wallet copy for a leg error, which core has already flattened to a string: a device status
 * enum, an `errors:*` key, or a node message. i18next runs here with `nsSeparator: false`, so
 * the first two would otherwise render verbatim; the third is shown as it arrived, being the
 * only text that says what the network actually objected to.
 */
export const resolveLegErrorHint = (
  error: string | undefined,
  translate: (key: string) => string
): string | null => {
  if (error == null || error === '') {
    return null;
  }

  const ledgerCopy = isLedgerEventStatus(error)
    ? ledgerErrorsData[error].title
    : null;

  if (ledgerCopy != null) {
    return translate(ledgerCopy);
  }

  const coreCopy = getCoreErrorCopy(new Error(error));

  return coreCopy == null ? error : translate(coreCopy.message);
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
      resolveLegErrorHint(state.approval.error, translate) ??
      (state.approval.isRequired ? null : translate('Not needed'))
  },
  {
    id: 'swap',
    text: translate('Swap'),
    status: state.swap.status,
    hint: resolveLegErrorHint(state.swap.error, translate)
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
    hint: resolveLegErrorHint(state.wrap.error, translate)
  }
];

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

/** What the form knows about the pay leg's affordability, from whichever hook drives it. */
export interface ISwapBalanceFlags {
  isAmountEntered: boolean;
  hasInsufficientBalance: boolean;
  hasInsufficientCsprForFee: boolean;
}

export type SwapBalanceBanner =
  'insufficientBalance' | 'insufficientCsprForFee';

/**
 * The one affordability banner the form may show, or `null`. Both flags fire together when the
 * pay leg is CSPR, and the balance is the half the user can act on by lowering the amount.
 */
export const resolveSwapBalanceBanner = ({
  isAmountEntered,
  hasInsufficientBalance,
  hasInsufficientCsprForFee
}: ISwapBalanceFlags): SwapBalanceBanner | null => {
  if (!isAmountEntered) {
    return null;
  }

  if (hasInsufficientBalance) {
    return 'insufficientBalance';
  }

  return hasInsufficientCsprForFee ? 'insufficientCsprForFee' : null;
};
