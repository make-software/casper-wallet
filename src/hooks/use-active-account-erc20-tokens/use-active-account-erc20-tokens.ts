import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useTranslation } from 'react-i18next';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { useForceUpdate } from '@src/apps/popup/hooks/use-force-update';
import { BALANCE_REFRESH_RATE } from '@src/constants';
import { dispatchFetchErc20TokensRequest } from '@src/libs/services/erc20-service';
import { getAccountHashFromPublicKey } from '@src/libs/entities/Account';
import { formatErc20TokenBalance } from '@src/apps/popup/pages/home/components/tokens-list/utils';
import { TokenType } from '../use-casper-token';

/**
 * Will get all active account erc20 tokens with automatic refresh
 */
export const useActiveAccountErc20Tokens = () => {
  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();
  const [tokens, setTokens] = useState<TokenType[] | undefined>(undefined);
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchErc20TokensRequest(
      getAccountHashFromPublicKey(activeAccount?.publicKey)
    )
      .then(({ payload: erc20Tokens }) => {
        const erc20TokensList = formatErc20TokenBalance(erc20Tokens);

        setTokens(erc20TokensList);
      })
      .catch(error => {
        console.error('Balance request failed:', error);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, BALANCE_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, t, forceUpdate]);

  return { tokens: tokens };
};
