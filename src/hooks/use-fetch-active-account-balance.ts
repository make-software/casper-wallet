import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { BALANCE_REFRESH_RATE } from '@src/constants';

import { useForceUpdate } from '@popup/hooks/use-force-update';

import {
  accountBalanceChanged,
  accountCurrencyRateChanged
} from '@background/redux/account-info/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchActiveAccountBalance } from '@libs/services/balance-service';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils';

export const useFetchActiveAccountBalance = () => {
  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperClarityApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    const accountHash = getAccountHashFromPublicKey(activeAccount.publicKey);

    dispatchFetchActiveAccountBalance(accountHash)
      .then(({ payload: { accountData, currencyRate } }) => {
        if (accountData != null) {
          const liquidBalance = accountData?.balance || 0;
          const delegatedBalance = accountData?.delegated_balance || 0;
          const undelegatingBalance = accountData?.undelegating_balance || 0;

          const totalAmountMotes =
            liquidBalance + delegatedBalance + undelegatingBalance;
          const totalBalanceFiat =
            currencyRate != null
              ? formatCurrency(
                  motesToCurrency(String(totalAmountMotes), currencyRate),
                  'USD',
                  {
                    precision: 2
                  }
                )
              : t('Currency service is offline...');

          dispatchToMainStore(accountCurrencyRateChanged(currencyRate));
          dispatchToMainStore(
            accountBalanceChanged({
              liquidMotes: String(liquidBalance),
              delegatedMotes: String(delegatedBalance),
              undelegatingMotes: String(undelegatingBalance),
              totalBalanceMotes: String(totalAmountMotes),
              totalBalanceFiat: totalBalanceFiat
            })
          );
        } else {
          dispatchToMainStore(accountCurrencyRateChanged(currencyRate));
          dispatchToMainStore(
            accountBalanceChanged({
              liquidMotes: null,
              undelegatingMotes: null,
              delegatedMotes: null,
              totalBalanceMotes: null,
              totalBalanceFiat: null
            })
          );
        }
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
  }, [activeAccount?.publicKey, casperClarityApiUrl, t, forceUpdate]);
};
