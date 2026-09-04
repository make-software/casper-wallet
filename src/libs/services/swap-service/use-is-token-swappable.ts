import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { isSafariBuild } from '@src/utils';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import { TokenType } from '@hooks/use-casper-token';

import { fetchDexTokensQuery } from '@libs/services/swap-service/queries';
import {
  isSwapAvailable,
  isTokenSwappable
} from '@libs/services/swap-service/utils';

/**
 * Whether the Swap action should be offered for `tokenData`, and whether that answer is still
 * being fetched. Native CSPR resolves without a request; a CEP-18 token is checked against
 * cspr.trade's whitelist. A failed request resolves to not-swappable rather than throwing.
 */
export const useIsTokenSwappable = (tokenData: TokenType | null) => {
  const network = useSelector(selectActiveNetworkSetting);

  const swapAvailable = isSwapAvailable(network, isSafariBuild);
  const isNativeCspr = tokenData?.id === 'Casper';
  const needsWhitelist = swapAvailable && Boolean(tokenData) && !isNativeCspr;

  const { data: dexTokens = [], isLoading } = useQuery({
    ...fetchDexTokensQuery({ network }),
    enabled: needsWhitelist
  });

  if (!swapAvailable) {
    return { isSwappable: false, isLoading: false };
  }

  if (isNativeCspr) {
    return { isSwappable: true, isLoading: false };
  }

  return {
    isSwappable: isTokenSwappable(dexTokens, tokenData),
    isLoading: needsWhitelist && isLoading
  };
};
