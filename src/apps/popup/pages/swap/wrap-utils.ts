import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';

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
