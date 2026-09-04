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
