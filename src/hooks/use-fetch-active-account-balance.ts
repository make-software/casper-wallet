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

import { dispatchFetchActiveAccountBalance } from '@libs/services/balance-service';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils';

export const useFetchActiveAccountBalance = () => {
  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchActiveAccountBalance(activeAccount?.publicKey)
      .then(({ payload: { balance, currencyRate } }) => {
        if (balance != null) {
          const amountMotes = balance;
          const amountFiat =
            currencyRate != null
              ? formatCurrency(motesToCurrency(balance, currencyRate), 'USD', {
                  precision: 2
                })
              : t('Currency service is offline...');

          dispatchToMainStore(accountCurrencyRateChanged(currencyRate));
          dispatchToMainStore(
            accountBalanceChanged({
              amountMotes: amountMotes,
              amountFiat: amountFiat
            })
          );
        } else {
          dispatchToMainStore(accountCurrencyRateChanged(currencyRate));
          dispatchToMainStore(
            accountBalanceChanged({
              amountMotes: null,
              amountFiat: ''
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
  }, [activeAccount?.publicKey, casperApiUrl, t, forceUpdate]);
};
