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

// Deep paths: these barrels reach modules that throw under the node-only jest environment.
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

export interface ISwapAmountRow {
  id: 'pay' | 'receive';
  label: string;
  icon: string | null;
  amount: string;
  symbol: string;
  fiat: string | null;
}

export interface ISwapDetailRow {
  id: 'rate' | 'priceImpact' | 'fee' | 'networkCost';
  text: string;
  value: string;
}

export interface ISwapProgressRow {
  id: 'approval' | 'swap' | 'wrap';
  text: string;
  status: TransactionStatus;
  /** "Not needed", or the leg's error. */
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

/** A line whose value is unknown is left out; a wrap has no rate, impact or fee, so only gas. */
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
 * Wallet copy for a leg error, which core has flattened to a string: a device status enum or an
 * `errors:*` key (verbatim under i18next's `nsSeparator: false`), or a node message, shown as-is.
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

/** `IWrapFlowState` carries no direction, so the caller passes one in. */
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

/** `null` until a token is selected, so the header keeps its CSPR default. */
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

export interface ISwapBalanceFlags {
  isAmountEntered: boolean;
  hasInsufficientBalance: boolean;
  hasInsufficientCsprForFee: boolean;
}

export type SwapBalanceBanner =
  'insufficientBalance' | 'insufficientCsprForFee';

/** Both flags fire together when the pay leg is CSPR; the balance is the actionable half. */
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
