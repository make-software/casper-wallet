import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { BALANCE_REFRESH_RATE } from '@src/constants';

import { useForceUpdate } from '@popup/hooks/use-force-update';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountsBalanceChanged } from '@background/redux/vault/actions';
import { selectVaultAccounts } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchAccountsBalance } from '@libs/services/balance-service';
import { Account } from '@libs/types/account';

export const useFetchAccountsBalance = () => {
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

    dispatchFetchAccountsBalance(hashes)
      .then(({ payload }) => {
        if ('data' in payload) {
          const accountsWithBalance: Account[] = accounts.map(account => {
            const accountWithBalance = payload.data.find(
              ac => ac.public_key === account.publicKey
            );

            return {
              ...account,
              balance: {
                liquidMotes: String(accountWithBalance?.balance || '0')
              }
            };
          });

          dispatchToMainStore(accountsBalanceChanged(accountsWithBalance));
        } else {
          const accountsWithoutBalance: Account[] = accounts.map(account => {
            return {
              ...account,
              balance: {
                liquidMotes: null
              }
            };
          });

          dispatchToMainStore(accountsBalanceChanged(accountsWithoutBalance));
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
  }, [casperClarityApiUrl, forceUpdate, accounts.length]);
};
