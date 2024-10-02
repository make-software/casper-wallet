import { useQueries } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  accountBalanceQuery,
  accountsBalancesQuery,
  currencyRateQuery
} from '@libs/services/balance-service/queries';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils';

export const useFetchWalletBalance = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);
  const accounts = useSelector(selectVaultAccounts);

  const accountHashes = accounts.map(account =>
    getAccountHashFromPublicKey(account.publicKey)
  );

  const accountHashesString = accountHashes.toString();

  const {
    accountBalance,
    isLoadingBalance,
    currencyRate,
    accountsBalances,
    isLoadingBalances
  } = useQueries({
    queries: [
      accountBalanceQuery({
        network,
        activeAccount
      }),
      currencyRateQuery({
        network
      }),
      accountsBalancesQuery({
        accountHashesString,
        network,
        accountHashes
      })
    ],
    combine: results => {
      const accountBalance = results[0].data;
      const totalBalance = results[0].data?.totalBalance;
      const liquidBalance = results[0].data?.liquidBalance;
      const delegatedBalance = results[0].data?.delegatedBalance;
      const undelegatingBalance = results[0].data?.undelegatingBalance;
      const currencyRate = results[1].data?.rate;
      const accountsBalances = results[2].data;

      const totalFormattedFiatBalance =
        currencyRate && totalBalance
          ? formatCurrency(
              motesToCurrency(String(totalBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';
      const liquidFormattedFiatBalance =
        currencyRate && liquidBalance
          ? formatCurrency(
              motesToCurrency(String(liquidBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';
      const delegatedFormattedFiatBalance =
        currencyRate && delegatedBalance
          ? formatCurrency(
              motesToCurrency(String(delegatedBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';
      const undelegatedFormattedFiatBalance =
        currencyRate && undelegatingBalance
          ? formatCurrency(
              motesToCurrency(String(undelegatingBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';

      return {
        accountBalance: {
          ...accountBalance,
          totalFormattedFiatBalance,
          liquidFormattedFiatBalance,
          delegatedFormattedFiatBalance,
          undelegatedFormattedFiatBalance
        },
        isLoadingBalance: results[0].isLoading,
        currencyRate: results[1].data,
        accountsBalances,
        isLoadingBalances: results[2].isLoading
      };
    }
  });

  return {
    accountBalance,
    isLoadingBalance,
    currencyRate,
    accountsBalances,
    isLoadingBalances
  };
};
