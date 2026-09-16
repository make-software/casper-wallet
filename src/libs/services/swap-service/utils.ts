import { IDexToken } from 'casper-wallet-core';
import { CSPR_NATIVE_TOKEN_ID } from 'casper-wallet-core/src/domain/constants/config';

import { NetworkSetting } from '@src/constants';

import { TokenType } from '@hooks/use-casper-token';

const NATIVE_CSPR_TOKEN_ID = 'Casper';

const normalizeHash = (hash: string) =>
  hash.toLowerCase().replace(/^hash-/, '');

/**
 * The token id a Swap entry point hands the swap page. Normalized because core is inconsistent
 * about the `hash-` prefix and casing while both consumers compare strictly.
 */
export const toSwapTokenId = (contractPackageHash?: string): string =>
  contractPackageHash
    ? normalizeHash(contractPackageHash)
    : CSPR_NATIVE_TOKEN_ID;

/** Whether Swap is offered at all: cspr.trade serves mainnet and testnet only; Safari hides it. */
export const isSwapAvailable = (
  network: NetworkSetting,
  isSafari: boolean
): boolean =>
  !isSafari &&
  (network === NetworkSetting.Mainnet || network === NetworkSetting.Testnet);

/** `dexTokens` is already the whitelist, so membership is the whole answer; native CSPR always. */
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
