import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';

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

/**
 * The rows the token selector offers for the position being edited.
 *
 * WCSPR has no DEX pool of its own, and the trade API's list folds its record into the synthetic
 * native CSPR row, so it never arrives as a listed token. It is only ever the other half of a
 * CSPR wrap or unwrap — so offer it exactly when the opposite card already holds native CSPR,
 * which makes both `CSPR -> WCSPR` and `WCSPR -> CSPR` reachable and keeps it out of every
 * ordinary pair.
 */
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
 * Whether an entry point's token id is the wrapped-CSPR contract, which is the one deep link
 * that cannot be resolved by handing it to core as `tokenInHash`: the listed tokens carry that
 * same `packageHash` on the synthetic native CSPR row, so core's preselection resolves it back
 * to CSPR. The caller seeds the `WCSPR -> CSPR` pair itself instead.
 *
 * The empty-hash guard matters on networks with no wrapped-CSPR deployment, where the constant
 * is `''` and would otherwise match an empty id.
 */
export function isUnwrapEntry(
  swapFromTokenId: string | null,
  wrappedCsprPackageHash: string
): boolean {
  return (
    wrappedCsprPackageHash !== '' && swapFromTokenId === wrappedCsprPackageHash
  );
}

/** The i18n keys one mode of the flow uses, so its form, confirm and success steps agree. */
export interface ISwapModeLabels {
  formTitle: string;
  confirmTitle: string;
  /** The pay card's "spend everything" shortcut. */
  maxLabel: string;
  successTitle: string;
}

export const swapModeLabels: Record<SwapFormMode, ISwapModeLabels> = {
  swap: {
    formTitle: 'Swap',
    confirmTitle: 'Confirm swap',
    maxLabel: 'Swap max',
    successTitle: "You've swapped tokens"
  },
  wrap: {
    formTitle: 'Wrap',
    confirmTitle: 'Confirm wrap',
    maxLabel: 'Wrap max',
    successTitle: "You've wrapped CSPR"
  },
  unwrap: {
    formTitle: 'Unwrap',
    confirmTitle: 'Confirm unwrap',
    maxLabel: 'Unwrap max',
    successTitle: "You've unwrapped WCSPR"
  }
};

/**
 * The mode a review snapshot describes. The later steps word themselves off the snapshot rather
 * than off live form state: the title must not move under a user who is reviewing.
 */
export const getReviewMode = (review: ISwapReviewData): SwapFormMode =>
  review.kind === 'wrap' ? review.direction : 'swap';
