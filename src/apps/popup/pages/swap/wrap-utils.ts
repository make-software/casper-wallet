import { WrapDirection } from 'casper-wallet-core';
import { CSPR_DECIMALS } from 'casper-wallet-core/src/domain/constants/casperNetwork';
import {
  CSPR_NATIVE_TOKEN_ID,
  DEX_PAYMENT_AMOUNT,
  FIAT_DECIMALS
} from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import {
  formatFiatBalance,
  getDecimalTokenBalance
} from 'casper-wallet-core/src/utils/common';
import { AmountDecimal } from 'casper-wallet-core/src/utils/decimal';

import { ISwapReviewData } from './types';

export type SwapFormMode = 'swap' | 'wrap' | 'unwrap';

/** CSPR/WCSPR has no DEX pool: this pair routes to `useWrapTokens` instead of `useSwapTokens`. */
export function getSwapFormMode(params: {
  first: IDexToken | null;
  second: IDexToken | null;
  wrappedCsprPackageHash: string;
}): SwapFormMode {
  const { first, second, wrappedCsprPackageHash } = params;

  if (
    first?.id === CSPR_NATIVE_TOKEN_ID &&
    second?.id === wrappedCsprPackageHash
  ) {
    return 'wrap';
  }

  if (
    first?.id === wrappedCsprPackageHash &&
    second?.id === CSPR_NATIVE_TOKEN_ID
  ) {
    return 'unwrap';
  }

  return 'swap';
}

/** WCSPR never arrives as a listed token, so offer it exactly when the opposite card holds CSPR. */
export function getSelectableTokens(params: {
  tokens: IDexToken[] | undefined;
  wcsprToken: IDexToken | undefined;
  oppositeToken: IDexToken | null;
}): IDexToken[] | undefined {
  const { tokens, wcsprToken, oppositeToken } = params;

  if (tokens == null || wcsprToken == null) {
    return tokens;
  }

  if (oppositeToken?.id !== CSPR_NATIVE_TOKEN_ID) {
    return tokens;
  }

  return [wcsprToken, ...tokens];
}

/**
 * Core's preselection resolves this hash back to CSPR, so the caller seeds the `WCSPR -> CSPR`
 * pair itself. The empty-hash guard matters where there is no wrapped-CSPR deployment.
 */
export function isUnwrapEntry(
  swapFromTokenId: string | null,
  wrappedCsprPackageHash: string
): boolean {
  return (
    wrappedCsprPackageHash !== '' && swapFromTokenId === wrappedCsprPackageHash
  );
}

export interface ISwapModeLabels {
  formTitle: string;
  confirmTitle: string;
  maxLabel: string;
  detailsTitle: string;
  successTitle: string;
}

export const swapModeLabels: Record<SwapFormMode, ISwapModeLabels> = {
  swap: {
    formTitle: 'Swap',
    confirmTitle: 'Confirm swap',
    maxLabel: 'Swap max',
    detailsTitle: 'Swap details',
    successTitle: "You've swapped tokens"
  },
  wrap: {
    formTitle: 'Wrap',
    confirmTitle: 'Confirm wrap',
    maxLabel: 'Wrap max',
    detailsTitle: 'Wrap details',
    successTitle: "You've wrapped CSPR"
  },
  unwrap: {
    formTitle: 'Unwrap',
    confirmTitle: 'Confirm unwrap',
    maxLabel: 'Unwrap max',
    detailsTitle: 'Unwrap details',
    successTitle: "You've unwrapped WCSPR"
  }
};

/** Off the review snapshot, not live form state: the title must not move under a user reviewing. */
export const getReviewMode = (review: ISwapReviewData): SwapFormMode =>
  review.kind === 'wrap' ? review.direction : 'swap';

/** Fiat when a rate has loaded, otherwise the CSPR figure, like the swap arm's `networkCost`. */
export const calculateWrapNetworkCost = (
  direction: WrapDirection,
  csprFiatRate: string | number | null | undefined,
  currencyCode: string
): string => {
  const paymentInMotes =
    direction === 'wrap' ? DEX_PAYMENT_AMOUNT.wrap : DEX_PAYMENT_AMOUNT.unwrap;
  const amount = getDecimalTokenBalance(paymentInMotes, CSPR_DECIMALS);

  if (!csprFiatRate) {
    return `${amount} CSPR`;
  }

  return formatFiatBalance(
    new AmountDecimal(amount).mul(csprFiatRate).toFixed(),
    null,
    FIAT_DECIMALS,
    { currencyCode, minFractionDigits: FIAT_DECIMALS }
  );
};
