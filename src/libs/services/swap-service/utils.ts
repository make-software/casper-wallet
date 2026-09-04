import { IDexToken } from 'casper-wallet-core';

import { NetworkSetting } from '@src/constants';

import { TokenType } from '@hooks/use-casper-token';

/** `TokenType.id` of native CSPR — see `useCasperToken`. */
const NATIVE_CSPR_TOKEN_ID = 'Casper';

const normalizeHash = (hash: string) =>
  hash.toLowerCase().replace(/^hash-/, '');

/**
 * Whether the Swap action is offered at all. cspr.trade only serves mainnet and testnet —
 * on the other two networks `casper-wallet-core` throws rather than issuing a request — and
 * the Safari build hides it entirely.
 */
export const isSwapAvailable = (
  network: NetworkSetting,
  isSafari: boolean
): boolean =>
  !isSafari &&
  (network === NetworkSetting.Mainnet || network === NetworkSetting.Testnet);

/**
 * Whether `tokenData` can be traded on cspr.trade. `dexTokens` is the list returned by
 * `getDexTokens`, which the API already filters to whitelisted, non-blacklisted tokens, so
 * membership is the whole answer. Native CSPR is always tradeable and never consults the
 * list — it appears there only as the rewritten WCSPR record.
 */
export const isTokenSwappable = (
  dexTokens: IDexToken[],
  tokenData: TokenType | null
): boolean => {
  if (!tokenData) {
    return false;
  }

  if (tokenData.id === NATIVE_CSPR_TOKEN_ID) {
    return true;
  }

  const { contractPackageHash } = tokenData;

  if (!contractPackageHash) {
    return false;
  }

  const normalized = normalizeHash(contractPackageHash);

  return dexTokens.some(
    token => normalizeHash(token.packageHash) === normalized
  );
};
