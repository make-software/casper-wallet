import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  ActiveAccountBalance,
  dispatchFetchActiveAccountBalance
} from '@libs/services/balance-service';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils/formatters';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useTranslation } from 'react-i18next';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { useForceUpdate } from '@src/apps/popup/hooks/use-force-update';
import { BALANCE_REFRESH_RATE } from '@src/constants';

export const useActiveAccountBalance = () => {
  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();
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

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, BALANCE_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, t, forceUpdate]);

  return { balance, currencyRate };
};
