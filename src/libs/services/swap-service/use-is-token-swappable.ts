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

/** Whether Swap is offered for `tokenData`; a failed whitelist request means not-swappable. */
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
