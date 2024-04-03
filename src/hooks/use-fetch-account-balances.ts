import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { BALANCE_REFRESH_RATE } from '@src/constants';

import { useForceUpdate } from '@popup/hooks/use-force-update';

import { accountBalancesChanged } from '@background/redux/account-balances/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultAccounts } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchAccountBalances } from '@libs/services/balance-service';

export const useFetchAccountBalances = () => {
  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();
  const { t } = useTranslation();

  const { casperClarityApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const accounts = useSelector(selectVaultAccounts);

  useEffect(() => {
    const hashes = accounts.reduce(
      (previousValue, currentValue, currentIndex) => {
        const hash = getAccountHashFromPublicKey(currentValue.publicKey);

        return accounts.length === currentIndex + 1
          ? previousValue + `${hash}`
          : previousValue + `${hash},`;
      },
      ''
    );

    dispatchFetchAccountBalances(hashes)
      .then(({ payload }) => {
        if ('data' in payload) {
          dispatchToMainStore(accountBalancesChanged(payload.data));
        } else {
          dispatchToMainStore(accountBalancesChanged([]));
        }
      })
      .catch(error => {
        console.error(t('Failed to fetch accounts balance'), error);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, BALANCE_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
  }, [casperClarityApiUrl, forceUpdate, accounts.length, accounts, t]);
};
