import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  ActiveAccountBalance,
  dispatchFetchActiveAccountBalance
} from '@libs/services/balance-service';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils/formatters';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useTranslation } from 'react-i18next';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useActiveAccountBalance = () => {
  const [balance, setBalance] = useState<ActiveAccountBalance>({
    amountMotes: null,
    amountFiat: null
  });
  const [currencyRate, setCurrencyRate] = useState<number | null>(null);
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
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

          setCurrencyRate(currencyRate);
          setBalance({ amountMotes: amountMotes, amountFiat: amountFiat });
        }
      })
      .catch(error => {
        console.error('Balance request failed:', error);
      });
  }, [activeAccount?.publicKey, casperApiUrl, t]);

  return { balance, currencyRate };
};
